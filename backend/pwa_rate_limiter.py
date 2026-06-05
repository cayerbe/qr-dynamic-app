"""
Rate limiting for PWA scanner to prevent abuse
"""

import time
from functools import wraps
from flask import request, jsonify
from collections import defaultdict
from datetime import datetime, timedelta

class PWARateLimiter:
    def __init__(self, app=None):
        self.app = app
        self.requests = defaultdict(list)
        self.blocked_ips = set()
        
        # Configuration
        self.max_requests_per_minute = 60
        self.max_requests_per_hour = 1000
        self.block_duration_minutes = 30
        
    def init_app(self, app):
        self.app = app
    
    def is_blocked(self, ip):
        """Check if IP is currently blocked"""
        return ip in self.blocked_ips
    
    def add_request(self, ip):
        """Log a request from an IP"""
        now = datetime.utcnow()
        self.requests[ip].append(now)
        
        # Clean old requests
        self.requests[ip] = [
            req for req in self.requests[ip] 
            if req > now - timedelta(hours=1)
        ]
    
    def check_rate_limit(self, ip):
        """Check if IP has exceeded rate limits"""
        now = datetime.utcnow()
        requests = self.requests[ip]
        
        # Count requests in last minute
        minute_ago = now - timedelta(minutes=1)
        recent_requests = sum(1 for req in requests if req > minute_ago)
        
        if recent_requests > self.max_requests_per_minute:
            self.blocked_ips.add(ip)
            return False, "Rate limit exceeded (per minute)"
        
        # Count requests in last hour
        hour_ago = now - timedelta(hours=1)
        hourly_requests = sum(1 for req in requests if req > hour_ago)
        
        if hourly_requests > self.max_requests_per_hour:
            self.blocked_ips.add(ip)
            return False, "Rate limit exceeded (per hour)"
        
        return True, "OK"
    
    def limit_requests(self, f):
        """Decorator for rate limiting"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = request.remote_addr
            
            # Check if blocked
            if self.is_blocked(ip):
                return jsonify({
                    "error": "Too many requests",
                    "retry_after": self.block_duration_minutes * 60
                }), 429
            
            # Check rate limit
            allowed, message = self.check_rate_limit(ip)
            if not allowed:
                return jsonify({
                    "error": message,
                    "retry_after": 60
                }), 429
            
            # Log request
            self.add_request(ip)
            
            return f(*args, **kwargs)
        
        return decorated_function

# Initialize rate limiter
pwa_rate_limiter = PWARateLimiter()
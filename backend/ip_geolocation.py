# ip_geolocation.py
import os
import json
import logging
import requests
import ipaddress
from typing import Dict, Optional
from functools import lru_cache

class FreeIPGeolocationService:
    def __init__(self, cache_size=100):
        """
        Initialize Free IP Geolocation Service
        
        :param cache_size: Number of recent lookups to cache
        """
        self.logger = logging.getLogger(__name__)
        self.cache_file = os.path.join(os.path.dirname(__file__), 'ip_geolocation_cache.json')
        self.load_cache()

    def load_cache(self):
        """Load existing IP geolocation cache"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    self.ip_cache = json.load(f)
            else:
                self.ip_cache = {}
        except Exception as e:
            self.logger.warning(f"Failed to load IP cache: {e}")
            self.ip_cache = {}

    def save_cache(self):
        """Save IP geolocation cache to file"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.ip_cache, f)
        except Exception as e:
            self.logger.warning(f"Failed to save IP cache: {e}")

    def validate_ip_address(self, ip_address: str) -> bool:
        """
        Validate IP address format
        
        :param ip_address: IP address to validate
        :return: Boolean indicating if IP is valid
        """
        try:
            ipaddress.ip_address(ip_address)
            return True
        except ValueError:
            return False

    def get_client_ip(self, request) -> str:
        """
        Retrieve client IP address from various possible headers
        
        :param request: Flask request object
        :return: Client IP address
        """
        ip_headers = [
            'X-Appengine-User-Ip',     # Google App Engine specific
            'X-Forwarded-For',          # Standard header for proxied requests
            'X-Real-IP',                # Nginx proxy header
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'               # Fallback to Flask's remote_addr
        ]
        
        ipv4_address = None
        ipv6_address = None
        
        for header in ip_headers:
            ip = request.headers.get(header)
            if ip:
                ip = ip.split(',')[0].strip()
                if ':' in ip:
                    self.logger.info(f"Got IPv6 address from {header}: {ip}")
                    if not ipv6_address:
                        ipv6_address = ip
                else:
                    self.logger.info(f"Got IPv4 address from {header}: {ip}")
                    return ip
        
        if ipv6_address:
            self.logger.info(f"Using IPv6 address: {ipv6_address}")
            return ipv6_address
        
        if request.remote_addr and request.remote_addr != '127.0.0.1':
            return request.remote_addr
        
        if ipv6_address:
            return ipv6_address
            
        return request.remote_addr

    @lru_cache(maxsize=100)
    def _fetch_geolocation_from_ipapi(self, ip_address: str) -> Optional[Dict[str, str]]:
        """
        Fetch geolocation using free ipapi.co service with fallbacks
        """
        try:
            # Try ipapi.co first
            self.logger.info(f"Fetching geolocation for IP {ip_address} using ipapi.co")
            response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=5)

            if response.status_code == 429:
                self.logger.warning(f"Rate limit hit for ipapi.co, trying fallback service")
                # Fallback to ip-api.com (100 requests per minute limit)
                return self._fetch_from_ip_api_com(ip_address)

            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"ipapi.co response: {json.dumps(data, indent=2)}")

                if not data or data.get('error', False):
                    self.logger.warning(f"API error for IP {ip_address}: {data}")
                    return None

                geolocation = {
                    'ip': ip_address,
                    'city': data.get('city') or 'Unknown',
                    'region': data.get('region') or 'Unknown',
                    'country': data.get('country_name') or 'Unknown',
                    'country_code': data.get('country_code') or 'Unknown',
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'timezone': data.get('timezone') or 'Unknown',
                    'continent': data.get('continent_code') or 'Unknown',
                    'postal_code': data.get('postal') or 'Unknown',
                    'isp': data.get('org') or 'Unknown',
                    'asn': data.get('asn') or 'Unknown'
                }

                # Remove None values
                geolocation = {k: v for k, v in geolocation.items() if v is not None}

                # Cache the result
                self.ip_cache[ip_address] = geolocation
                self.logger.info(f"Successfully geolocated {ip_address} via ipapi.co: {geolocation}")
                return geolocation

            self.logger.error(f"ipapi.co returned status {response.status_code} for IP {ip_address}")
            return None

        except Exception as e:
            self.logger.error(f"Primary geolocation failed for {ip_address}, trying fallback: {e}")
            return self._fetch_from_ip_api_com(ip_address)

    def _fetch_from_ip_api_com(self, ip_address: str) -> Optional[Dict[str, str]]:
        """
        Fallback geolocation service using ip-api.com
        """
        try:
            self.logger.info(f"Fetching geolocation for IP {ip_address} using ip-api.com")
            response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)

            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"ip-api.com response: {json.dumps(data, indent=2)}")

                if data.get('status') == 'success':
                    geolocation = {
                        'ip': ip_address,
                        'city': data.get('city', 'Unknown'),
                        'region': data.get('regionName', 'Unknown'),
                        'country': data.get('country', 'Unknown'),
                        'country_code': data.get('countryCode', 'Unknown'),
                        'latitude': data.get('lat'),
                        'longitude': data.get('lon'),
                        'timezone': data.get('timezone', 'Unknown'),
                        'isp': data.get('isp', 'Unknown'),
                        'asn': data.get('as', 'Unknown')
                    }

                    # Remove None values
                    geolocation = {k: v for k, v in geolocation.items() if v is not None}

                    # Cache the result
                    self.ip_cache[ip_address] = geolocation
                    self.logger.info(f"Successfully geolocated {ip_address} via ip-api.com: {geolocation}")
                    return geolocation

            self.logger.error(f"ip-api.com returned status {response.status_code} for IP {ip_address}")
            return None

        except Exception as e:
            self.logger.error(f"Fallback geolocation failed for {ip_address}: {e}")
            return None

    def get_ip_geolocation(self, ip_address: str) -> Optional[Dict[str, str]]:
        """
        Retrieve geolocation data with multiple fallback strategies
        
        :param ip_address: IP address to geolocate
        :return: Geolocation dictionary or None
        """
        if ip_address in ['127.0.0.1', '::1', 'localhost']:
            self.logger.warning(f"Skipping geolocation for localhost: {ip_address}")
            return {
                'ip': ip_address,
                'city': 'Localhost',
                'country': 'Localhost',
                'country_code': 'LO',
                'risk_score': 0,
                'threat_level': 'Low',
                'is_localhost': True
            }
        
        if not self.validate_ip_address(ip_address):
            self.logger.error(f"Invalid IP address: {ip_address}")
            return None

        is_ipv6 = ':' in ip_address
        cached_result = self.ip_cache.get(ip_address)
        if cached_result:
            self.logger.info(f"Using cached result for {ip_address}")
            return cached_result

        if is_ipv6:
            geolocation = self._fetch_geolocation_ipv6(ip_address)
        else:
            geolocation = self._fetch_geolocation_from_ipapi(ip_address)
        
        if geolocation:
            self.ip_cache[ip_address] = geolocation
            self.save_cache()
        
        return geolocation

    def enrich_geolocation(self, geolocation: Dict[str, str]) -> Dict[str, str]:
        """
        Enrich geolocation data with additional metadata
        
        :param geolocation: Base geolocation dictionary
        :return: Enriched geolocation dictionary
        """
        if not geolocation:
            return {}

        # Create a copy to avoid modifying the original
        enriched = geolocation.copy()

        # Add risk and threat indicators
        enriched['risk_score'] = self._calculate_ip_risk(geolocation)
        enriched['threat_level'] = self._determine_threat_level(enriched)

        # Ensure all values are Firestore-compatible
        for key, value in list(enriched.items()):
            if value == 'Unknown':
                del enriched[key]  # Remove 'Unknown' values

        return enriched

    def _calculate_ip_risk(self, geolocation: Dict[str, str]) -> int:
        """
        Calculate basic risk score for an IP
        
        :param geolocation: Geolocation dictionary
        :return: Risk score (0-100)
        """
        risk_score = 0

        # Increment risk for suspicious locations or ISPs
        suspicious_countries = ['RU', 'CN', 'IR', 'KP']  # Example high-risk countries
        if geolocation.get('country_code') in suspicious_countries:
            risk_score += 30

        # Check for known anonymizing networks
        anonymizing_keywords = ['proxy', 'vpn', 'tor', 'anonymous']
        if any(keyword in str(geolocation.get('isp', '')).lower() for keyword in anonymizing_keywords):
            risk_score += 25

        return min(risk_score, 100)

    def _determine_threat_level(self, geolocation: Dict[str, str]) -> str:
        """
        Determine threat level based on risk score
        
        :param geolocation: Geolocation dictionary
        :return: Threat level string
        """
        risk_score = geolocation.get('risk_score', 0)
        
        if risk_score < 20:
            return 'Low'
        elif risk_score < 50:
            return 'Medium'
        elif risk_score < 80:
            return 'High'
        else:
            return 'Critical'

    def _fetch_geolocation_ipv6(self, ip_address: str) -> Optional[Dict[str, str]]:
        """
        Handle IPv6 geolocation with a service that supports it
        """
        try:
            self.logger.info(f"Fetching IPv6 geolocation for {ip_address}")
            response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data and not data.get('error'):
                    return self._parse_ipapi_response(data, ip_address)
            
            self.logger.info(f"Trying ipinfo.io for IPv6")
            response = requests.get(f'https://ipinfo.io/{ip_address}/json', timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'ip': ip_address,
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('region', 'Unknown'),
                    'country': data.get('country', 'Unknown'),
                    'country_code': data.get('country', 'Unknown'),
                    'latitude': float(data.get('loc', '0,0').split(',')[0]) if data.get('loc') else None,
                    'longitude': float(data.get('loc', '0,0').split(',')[1]) if data.get('loc') else None,
                    'timezone': data.get('timezone', 'Unknown'),
                    'isp': data.get('org', 'Unknown')
                }
            
            return {
                'ip': ip_address,
                'city': 'Unknown',
                'region': 'Unknown',
                'country': 'Unknown',
                'country_code': 'XX',
                'ipv6_note': 'IPv6 geolocation limited'
            }
            
        except Exception as e:
            self.logger.error(f"IPv6 geolocation failed for {ip_address}: {e}")
            return None

    def _parse_ipapi_response(self, data: dict, ip_address: str) -> dict:
        """Parse ipapi.co response into standard format"""
        return {
            'ip': ip_address,
            'city': data.get('city') or 'Unknown',
            'region': data.get('region') or 'Unknown',
            'country': data.get('country_name') or 'Unknown',
            'country_code': data.get('country_code') or 'Unknown',
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude'),
            'timezone': data.get('timezone') or 'Unknown',
            'continent': data.get('continent_code') or 'Unknown',
            'postal_code': data.get('postal') or 'Unknown',
            'isp': data.get('org') or 'Unknown',
            'asn': data.get('asn') or 'Unknown'
        }

def analyze_geo_risk(ip_address: str) -> dict:
    """
    Dummy function for geo-risk analysis.
    Replace with actual IP threat intelligence and geolocation checks.
    """
    return {
        "geo_risk_score": 0.02,
        "is_blocked_region": False,
        "country": "IT",
        "region": "Lazio",
        "city": "Rome",
        "reason": "Low risk IP address from known location"
    }

# Singleton instance for easy import
ip_geo_service = FreeIPGeolocationService()
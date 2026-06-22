import uuid
from datetime import datetime
from supabase_client import supabase
import json
import json

def sanitize_for_json(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    return obj

class ShimDocumentSnapshot:
    def __init__(self, data, exists, doc_id=None):
        self._data = data
        self.exists = exists
        self.id = doc_id

    def to_dict(self):
        return self._data
    
    def get(self, key, default=None):
        if not self._data: return default
        # handle nested keys like 'data.verification_signature'
        keys = key.split('.')
        val = self._data
        for k in keys:
            if isinstance(val, dict) and k in val:
                val = val[k]
            else:
                return default
        return val

class ShimDocumentReference:
    def __init__(self, table_name, doc_id):
        self.table_name = table_name
        self.doc_id = doc_id
        
    def get(self):
        if not supabase: return ShimDocumentSnapshot(None, False)
        # Convert table names
        table = self.table_name
        res = supabase.table(table).select("*").eq("id", self.doc_id).execute()
        if res.data and len(res.data) > 0:
            return ShimDocumentSnapshot(res.data[0], True, self.doc_id)
        return ShimDocumentSnapshot(None, False, self.doc_id)

    def set(self, data):
        if not supabase: return
        data['id'] = self.doc_id
        
        # Safely map qr_codes to match Supabase schema
        if self.table_name == 'qr_codes':
            safe_data = {
                'id': data.get('id'),
                'user_id': data.get('user_id'),
                'name': data.get('name'),
                'description': data.get('description'),
                'type': data.get('type'),
                'content_type': data.get('content_type'),
                'data': data.get('data', {}),
                'image_url': data.get('image_url') or data.get('qr_image_url'),
                'intensity': data.get('intensity'),
                'physical_properties': data.get('physical_properties', {}),
                'security_features': data.get('security_features', {}),
                'scan_statistics': data.get('scan_statistics', {"total_scans": 0, "total_scan_attempts": 0}),
                'model_config': data.get('model_config', {}),
                'usage_guidelines': data.get('usage_guidelines', {}),
                'forensic_profile': data.get('forensic_profile', {}),
                'generation_stats': data.get('generation_stats', {}),
                'ipzs_compliance': data.get('ipzs_compliance', {}),
                'campaign': data.get('campaign'),
                'tags': data.get('tags', []),
                'short_code': data.get('short_code'),
                'verification_id': data.get('verification_id'),
                'metadata': data.get('metadata', {})
            }
            # Bundle any extra fields into metadata
            valid_keys = set(safe_data.keys())
            for k, v in data.items():
                if k not in valid_keys and k not in ['created_at', 'updated_at']:
                    # Format datetime objects inside metadata if any
                    if isinstance(v, datetime):
                        v = v.isoformat()
                    safe_data['metadata'][k] = v
            
            if 'created_at' in data:
                if isinstance(data['created_at'], datetime):
                    safe_data['created_at'] = data['created_at'].isoformat()
                else:
                    safe_data['created_at'] = data['created_at']
                    
            data = {k: v for k, v in safe_data.items() if v is not None}
            
        elif self.table_name == 'qr_scan_logs':
            safe_data = {
                'id': data.get('id') or data.get('scan_id'),
                'qr_id': data.get('qr_id'),
                'user_id': data.get('user_id'),
                'device_info': data.get('device_info', {}),
                'location_info': data.get('location_info', {}),
                'qr_type': data.get('qr_type'),
                'content_type': data.get('content_type'),
                'scan_type': data.get('scan_type'),
                'anti_forgery_analysis': data.get('anti_forgery_analysis', {})
            }
            if 'timestamp' in data:
                if isinstance(data['timestamp'], datetime):
                    safe_data['timestamp'] = data['timestamp'].isoformat()
                else:
                    safe_data['timestamp'] = data['timestamp']
                    
            # Put extra info into anti_forgery_analysis
            if 'network_info' in data:
                safe_data['anti_forgery_analysis']['network_info'] = data['network_info']
                
            data = {k: v for k, v in safe_data.items() if v is not None}
            
        data = sanitize_for_json(data)
        supabase.table(self.table_name).upsert(data).execute()
        
    def update(self, data):
        if not supabase: return
        # Custom logic for updates, especially jsonb partial updates
        # To keep it simple, we fetch, merge, and upsert
        res = supabase.table(self.table_name).select("*").eq("id", self.doc_id).execute()
        if not res.data: return
        current_data = res.data[0]
        # In a real shim, we'd do deep merge here or call RPC for increments
        for k, v in data.items():
            if "Increment" in str(type(v)):
                # Hack for increment - ideally use RPC
                pass
            else:
                # Handle dot notation (e.g., 'scan_statistics.total_scans')
                if '.' in k:
                    parts = k.split('.')
                    if parts[0] not in current_data or not isinstance(current_data[parts[0]], dict):
                        current_data[parts[0]] = {}
                    current_data[parts[0]][parts[1]] = v
                else:
                    current_data[k] = v
        current_data = sanitize_for_json(current_data)
        supabase.table(self.table_name).update(current_data).eq("id", self.doc_id).execute()
        
    def collection(self, sub_collection):
        # We flattened subcollections in Supabase schema (e.g. qr_scan_logs has qr_id)
        return ShimCollectionReference(sub_collection, parent_id=self.doc_id, parent_table=self.table_name)

class ShimQuery:
    def __init__(self, table_name, filters=None, order_by=None, limit=None):
        self.table_name = table_name
        self.filters = filters or []
        self.order_by_col = order_by[0] if order_by else None
        self.order_desc = order_by[1] == 'DESCENDING' if order_by else False
        self.limit_count = limit
        
    def limit(self, count):
        return ShimQuery(self.table_name, self.filters, (self.order_by_col, 'DESCENDING' if self.order_desc else 'ASCENDING') if self.order_by_col else None, count)
        
    def where(self, field=None, op=None, value=None, filter=None):
        new_filters = list(self.filters)
        if filter:
            # FieldFilter extraction logic
            field = getattr(filter, 'field_path', None)
            if not field and hasattr(filter, 'field'): field = filter.field
            
            op = getattr(filter, 'op_string', None)
            if not op and hasattr(filter, 'operator'): op = filter.operator
            if not op and hasattr(filter, 'op'): op = filter.op
            
            value = getattr(filter, 'value', None)
        new_filters.append((field, op, value))
        return ShimQuery(self.table_name, new_filters, (self.order_by_col, 'DESCENDING' if self.order_desc else 'ASCENDING') if self.order_by_col else None, self.limit_count)

    def get(self):
        return self.stream()

    def stream(self):
        if not supabase: return []
        q = supabase.table(self.table_name).select("*")
        for field, op, value in self.filters:
            if op == '==':
                # Handle nested JSONB querying in Supabase
                if '.' in field:
                    parts = field.split('.')
                    # E.g. data->>verification_id
                    q = q.eq(f"{parts[0]}->>{parts[1]}", str(value))
                else:
                    q = q.eq(field, value)
            elif op == '>=':
                q = q.gte(field, value)
        
        if self.order_by_col:
            q = q.order(self.order_by_col, desc=self.order_desc)
        if self.limit_count:
            q = q.limit(self.limit_count)
            
        res = q.execute()
        return [ShimDocumentSnapshot(d, True, d.get('id')) for d in res.data] if res.data else []
    
    # for docs = list(query...)
    def __iter__(self):
        return iter(self.stream())
    
    def __getitem__(self, idx):
        return self.stream()[idx]

class ShimCollectionReference:
    def __init__(self, table_name, parent_id=None, parent_table=None):
        self.table_name = table_name
        self.parent_id = parent_id
        self.parent_table = parent_table

    def document(self, doc_id=None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        # For subcollections like qr_codes/{id}/scan_logs, we use qr_scan_logs
        actual_table = self.table_name
        if self.parent_table == 'qr_codes' and self.table_name == 'scan_logs':
            actual_table = 'qr_scan_logs'
            
        return ShimDocumentReference(actual_table, doc_id)

    def add(self, data):
        doc_ref = self.document()
        if self.parent_id:
            data['qr_id'] = self.parent_id
        doc_ref.set(data)
        return None, doc_ref

    def where(self, field=None, op=None, value=None, filter=None):
        q = ShimQuery(self.table_name)
        if self.parent_id:
            q = q.where('qr_id', '==', self.parent_id)
        return q.where(field, op, value, filter)

    def order_by(self, field, direction="ASCENDING"):
        q = ShimQuery(self.table_name, order_by=(field, direction))
        if self.parent_id:
            q = q.where('qr_id', '==', self.parent_id)
        return q
        
    def stream(self):
        return ShimQuery(self.table_name).stream()

class ShimFirestoreClient:
    def __init__(self):
        self.real_db = None
        # We exclusively use Supabase now. Legacy Firebase initialization removed.

    def collection(self, collection_name):
        return ShimCollectionReference(collection_name)

db = ShimFirestoreClient()

# Mock firestore globals
class MockFirestore:
    SERVER_TIMESTAMP = datetime.utcnow().isoformat()
    class Query:
        DESCENDING = "DESCENDING"
        ASCENDING = "ASCENDING"
    class Increment:
        def __init__(self, val):
            self.val = val

firestore = MockFirestore()

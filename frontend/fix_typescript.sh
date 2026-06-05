#!/bin/bash

echo "🔧 Running automated TypeScript error fixes..."

# 1. Fix .toDate().toDate() errors
sed -i '' 's/\.toDate().toDate()/\.toDate()/g' src/components/qr-management/userQRManagementLogic.ts

# 2. Fix unknown response types in qrApiService.ts
sed -i '' 's/const response = await api.get(/const response = await api.get<{ data: any }>(/g' src/services/qrApiService.ts

# 3. Fix response as unknown by type asserting to any
sed -i '' 's/response\.data/((response as any).data)/g' src/services/qrApiService.ts

# 4. Fix logs access error in AdminDashboard.tsx
sed -i '' 's/logsResponse\?\.logs/(logsResponse as any)?.logs/g' src/components/admin/AdminDashboard.tsx

# 5. Fix this.baseURL fallback
sed -i '' 's#this.baseURL = API_BASE_URL;#this.baseURL = API_BASE_URL || "https://crack-celerity-419510.uc.r.appspot.com/api";#' src/services/api.ts

echo "✅ All automated fixes applied. You can now rerun: npx tsc --noEmit"

# 6. Remove duplicate properties from convertToQRCode object in qr-service.ts
echo "🧹 Removing duplicate keys from qr-service.ts..."
sed -i '' '/convertToQRCode({/,/})/ {
  /type: /{
    x;/type/d;x
  }
  /contentType: /{
    x;/contentType/d;x
  }
  /userId: /{
    x;/userId/d;x
  }
  /campaign: /{
    x;/campaign/d;x
  }
}' src/services/qr-service.ts

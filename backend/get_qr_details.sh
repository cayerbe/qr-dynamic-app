#!/bin/bash

# Curl commands to fetch details for all 10 QR codes from Firestore
# Replace YOUR_PROJECT_ID with: crack-celerity-419510

BASE_URL="https://firestore.googleapis.com/v1/projects/crack-celerity-419510/databases/(default)/documents"

# QR Code #1 - Low Intensity
curl -X GET "${BASE_URL}/qr_codes/QR_1750956904_280e509d" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #2 ==="
# QR Code #2 - Standard
curl -X GET "${BASE_URL}/qr_codes/QR_1750956955_496280e6" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #3 ==="
# QR Code #3 - Medium
curl -X GET "${BASE_URL}/qr_codes/QR_1750956981_72a37e23" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #4 ==="
# QR Code #4 - High Security
curl -X GET "${BASE_URL}/qr_codes/QR_1750957014_077fc347" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #5 ==="
# QR Code #5 - Maximum
curl -X GET "${BASE_URL}/qr_codes/QR_1750957044_26d6d169" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #6 ==="
# QR Code #6 - Business Card
curl -X GET "${BASE_URL}/qr_codes/QR_1750957069_eb8a2547" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #7 ==="
# QR Code #7 - Poster Size
curl -X GET "${BASE_URL}/qr_codes/QR_1750957089_f84fdadc" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #8 ==="
# QR Code #8 - ID Card
curl -X GET "${BASE_URL}/qr_codes/QR_1750957125_ba8ea3b1" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #9 ==="
# QR Code #9 - Ticket
curl -X GET "${BASE_URL}/qr_codes/QR_1750957151_f7780fb4" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"

echo -e "\n\n=== QR Code #10 ==="
# QR Code #10 - Ultra Fine
curl -X GET "${BASE_URL}/qr_codes/QR_1750957195_1d0c3908" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)"
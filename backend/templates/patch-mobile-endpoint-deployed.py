# Replace your get_itinerary_mobile function with this patched version:

@itinerary_routes.route('/<itinerary_id>/mobile', methods=['GET'])
def get_itinerary_mobile(itinerary_id):
    """Get mobile-optimized itinerary data with proper image and children support"""
    try:
        logger.info(f"📱 Mobile request for itinerary: {itinerary_id}")
        
        # Get itinerary from Firebase
        db = firestore.client()
        doc_ref = db.collection('itineraries').document(itinerary_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'Itinerary not found'}), 404
            
        itinerary = doc.to_dict()
        itinerary['id'] = itinerary_id
        
        # Get all landmarks for this itinerary
        landmarks_ref = db.collection('landmarks')
        landmarks_query = landmarks_ref.where('itinerary_id', '==', itinerary_id)
        landmark_docs = landmarks_query.get()
        
        mobile_landmarks = []
        cover_image_url = None  # 🔥 ADD THIS: Track cover image
        
        for landmark_doc in landmark_docs:
            landmark = landmark_doc.to_dict()
            landmark['id'] = landmark_doc.id
            
            # Enhanced image extraction from image_gallery
            image_url = ''
            image_gallery = landmark.get('image_gallery', [])
            
            if image_gallery and len(image_gallery) > 0:
                # Find primary image first
                for img in image_gallery:
                    if img.get('isPrimary'):
                        image_url = img.get('thumbUrl', img.get('originalUrl', ''))
                        break
                
                # If no primary, use first image
                if not image_url and image_gallery:
                    first_img = image_gallery[0]
                    image_url = first_img.get('thumbUrl', first_img.get('originalUrl', ''))
            
            # Fallback to other fields if image_gallery is empty
            if not image_url:
                image_url = landmark.get('image_url') or landmark.get('imageUrl') or landmark.get('imagePath', '')
            
            # 🔥 ADD THIS: Set cover image as first valid image found
            if not cover_image_url and image_url:
                cover_image_url = image_url

            # Transform for mobile
            mobile_landmark = {
                'id': landmark['id'],
                'name': landmark.get('name', ''),
                'description': landmark.get('description', ''),
                'latitude': landmark.get('latitude', 0.0),
                'longitude': landmark.get('longitude', 0.0),
                'address': landmark.get('address', ''),
                'visit_duration': landmark.get('visit_duration', 30),
                'image_url': image_url,
                'image_gallery': image_gallery,
                'audio_url': landmark.get('audio_url', ''),
                'has_audio': landmark.get('has_audio', False),
                'categories': landmark.get('categories', []),
                'theme': landmark.get('theme', itinerary.get('theme', '')),
                'order': landmark.get('order', 0),
                'landmark_type': landmark.get('landmark_type', 'default'),
                'main_category': landmark.get('main_category', ''),
            }
            
            mobile_landmarks.append(mobile_landmark)
        
        # Create mobile response
        mobile_response = {
            'success': True,
            'itinerary': {
                'id': itinerary_id,
                'title': itinerary.get('title', ''),
                'theme': itinerary.get('theme', ''),
                'city': itinerary.get('city', ''),
                'duration': itinerary.get('duration', ''),
                'description': itinerary.get('description', ''),
                'status': itinerary.get('status', ''),
                'landmark_count': len(mobile_landmarks),
                'total_duration_minutes': sum(l.get('visit_duration', 30) for l in mobile_landmarks),
                'created_at': itinerary.get('created_at', ''),
                'updated_at': itinerary.get('updated_at', ''),
                # 🔥 ADD THESE THREE LINES for cover image:
                'cover_image_url': cover_image_url,
                'image_url': cover_image_url,  # For compatibility
                'photo_url': cover_image_url   # For compatibility
            },
            'landmarks': mobile_landmarks
        }
        
        logger.info(f"✅ Mobile itinerary sent: {len(mobile_landmarks)} landmarks, cover image: {bool(cover_image_url)}")
        
        return jsonify(mobile_response)
        
    except Exception as e:
        logger.error(f"❌ Error getting mobile itinerary: {str(e)}")
        return jsonify({'error': str(e)}), 500
"""
Manually poll pending transcription jobs
"""
from app.database import SessionLocal
from app.services.sync_service import sync_service
import sys

def main():
    db = SessionLocal()
    try:
        print("Polling pending transcription jobs...")
        counts = sync_service.poll_pending_transcriptions(db=db)
        
        print("\nResults:")
        print(f"  ✓ Updated: {counts['updated']}")
        print(f"  ⏳ Still Pending: {counts['still_pending']}")
        print(f"  ✗ Failed: {counts['failed']}")
        
        if counts['updated'] > 0:
            print(f"\n✓ Successfully updated {counts['updated']} transcripts!")
        if counts['still_pending'] > 0:
            print(f"\n⏳ {counts['still_pending']} jobs still in progress")
        if counts['failed'] > 0:
            print(f"\n✗ {counts['failed']} jobs failed")
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

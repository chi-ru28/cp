from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routes.chat_routes import get_current_user
import models

router = APIRouter()

@router.get("/")
def get_analysis_reports(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        # Sort by created_at descending
        reports = db.query(models.CropImage).filter(models.CropImage.user_id == current_user.get("user_id")).order_by(models.CropImage.created_at.desc()).all()
        # The nodejs API returned { reports: [{id, ...}] }
        result = []
        for r in reports:
            result.append({
                "id": str(r.id),
                "image_url": r.image_url,
                "description": r.description,
                "created_at": r.created_at.isoformat() if r.created_at else None
            })
        return {"reports": result}
    except Exception as err:
        print("Fetch analysis error:", err)
        raise HTTPException(status_code=500, detail="Failed to load analysis reports.")

@router.delete("/{report_id}")
def delete_analysis_report(report_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        report = db.query(models.CropImage).filter(models.CropImage.id == report_id, models.CropImage.user_id == current_user.get("user_id")).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        db.delete(report)
        db.commit()
        return {"message": "Report deleted.", "deletedCount": 1}
    except HTTPException:
        raise
    except Exception as err:
        print("Delete analysis error:", err)
        raise HTTPException(status_code=500, detail="Failed to delete report.")

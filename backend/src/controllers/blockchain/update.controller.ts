import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;

    const { status } = req.body;
    if (!status || !["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (Array.isArray(id)) id = id[0];
    const [attendanceId, childId] = String(id).split("-");

    if (!attendanceId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const record = attendance.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );

    if (!record) {
      return res.status(404).json({ message: "Child record not found" });
    }

    if (record.status !== status) {
      record.status = status;
      attendance.markModified("records");
      await attendance.save();
    }
    res.json({ message: "Attendance record updated" });
  } catch (error: any) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Failed to update attendance record" });
  }
};

export const updateFeedingRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;

    const { status } = req.body;

    if (!status || !["completed", "missed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (Array.isArray(id)) id = id[0];
    const [feedingId, childId] = String(id).split("-");

    if (!feedingId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const feeding = await Feeding.findById(feedingId);

    if (!feeding) {
      return res.status(404).json({ message: "Feeding not found" });
    }

    const record = feeding.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );

    if (!record) {
      return res.status(404).json({ message: "Child record not found" });
    }

    if (record.status !== status) {
      record.status = status;
      feeding.markModified("records");
      await feeding.save();
    }

    res.json({ message: "Feeding record updated" });
  } catch (error: any) {
    console.error("Update feeding error:", error);
    res.status(500).json({ message: "Failed to update feeding record" });
  }
};

export const deleteAttendanceRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;

    if (Array.isArray(id)) id = id[0];

    const [attendanceId, childId] = String(id).split("-");

    if (!attendanceId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const initialLength = attendance.records.length;

    attendance.records.pull({ child: childId });

    if (attendance.records.length === initialLength) {
      return res.status(404).json({ message: "Child record not found" });
    }

    attendance.markModified("records");

    await attendance.save();

    res.json({ message: "Attendance record deleted" });
  } catch (error: any) {
    console.error("Delete attendance error:", error);
    res.status(500).json({ message: "Failed to delete attendance record" });
  }
};

export const deleteFeedingRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;

    if (Array.isArray(id)) id = id[0];

    const [feedingId, childId] = String(id).split("-");

    if (!feedingId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const feeding = await Feeding.findById(feedingId);

    if (!feeding) {
      return res.status(404).json({ message: "Feeding not found" });
    }

    const initialLength = feeding.records.length;

    feeding.records.pull({ child: childId });

    if (feeding.records.length === initialLength) {
      return res.status(404).json({ message: "Child record not found" });
    }

    feeding.markModified("records");

    await feeding.save();

    res.json({ message: "Feeding record deleted" });
  } catch (error: any) {
    console.error("Delete feeding error:", error);
    res.status(500).json({ message: "Failed to delete feeding record" });
  }
};

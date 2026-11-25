import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler";
import User from "../../../shared/models/users.model";
import ChildDevelopmentCenter from "../../../shared/models/child-development-center.model";

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return res.json({ results: [] });
  }

  const searchRegex = new RegExp(normalizedQuery, "i");

  const [users, centers] = await Promise.all([
    User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    }).limit(5).lean(),
    ChildDevelopmentCenter.find({
      name: searchRegex,
    }).limit(3).lean(),
  ]);

  const results = [
    ...users.map((u: any) => ({
      id: u._id.toString(),
      type: "user",
      title: `${u.firstName} ${u.lastName}`,
      subtitle: u.role,
      url: `/users/${u._id}`,
    })),
    ...centers.map((c: any) => ({
      id: c._id.toString(),
      type: "center",
      title: c.name,
      subtitle: "Daycare Center",
      url: `/centers/${c._id}`,
    })),
  ];

  res.json({ results });
});


import ChildDevelopmentCenter from "../../models/ChildDevelopmentCenter";
import { NotFoundError } from "../errors/app-error";
import { SINGLE_CENTER } from "../config/single-center";

export const getSingleCenter = async () => {
  const center = await ChildDevelopmentCenter.findOne({
    code: SINGLE_CENTER.code,
    isActive: { $ne: false },
  })
    .select("_id name barangay code isActive")
    .lean();

  if (!center) {
    throw new NotFoundError(SINGLE_CENTER.name);
  }

  return center;
};

export const getSingleCenterId = async (): Promise<string> =>
  String((await getSingleCenter())._id);

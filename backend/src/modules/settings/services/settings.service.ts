import SystemSettings from "../../../models/SystemSettings";

export class SystemSettingsService {

   async getSettings() {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        schoolName: "Smart KidCare",
        address: "",
      });
    }
    return settings;
  }

  async updateSettings(data: { schoolName?: string; address?: string }) {
    const settings = await SystemSettings.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true }
    );
    return settings;
  }
}

export const settingsService = new SystemSettingsService();

import { enrollmentService } from "@/src/features/enrollment/services";
import { childrenService } from "@/src/features/children/services";

export * from "@/src/features/enrollment/services";
export * from "@/src/features/children/services";

export class TeacherApi {
  verifyEnrollmentDocument =
    enrollmentService.verifyEnrollmentDocument.bind(enrollmentService);
  confirmEnrollmentDocument =
    enrollmentService.confirmEnrollmentDocument.bind(enrollmentService);
  getEnrollmentCenters =
    enrollmentService.getEnrollmentCenters.bind(enrollmentService);
  submitChildEnrollment =
    enrollmentService.submitChildEnrollment.bind(enrollmentService);
  getChildren = childrenService.getChildren.bind(childrenService);
  getChildParentCredentials =
    childrenService.getChildParentCredentials.bind(childrenService);
  resetChildParentPassword =
    childrenService.resetChildParentPassword.bind(childrenService);
  updateChild = childrenService.updateChild.bind(childrenService);
  archiveChild = childrenService.archiveChild.bind(childrenService);
  restoreChild = childrenService.restoreChild.bind(childrenService);
}

export const teacherApi = new TeacherApi();

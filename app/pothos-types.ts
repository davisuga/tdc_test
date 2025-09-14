/* eslint-disable */
import type { Prisma, VehicleAssessment, VehicleDetails, ConditionIssue, VinSubmission } from "./generated/prisma/client.js";
export default interface PrismaTypes {
    VehicleAssessment: {
        Name: "VehicleAssessment";
        Shape: VehicleAssessment;
        Include: Prisma.VehicleAssessmentInclude;
        Select: Prisma.VehicleAssessmentSelect;
        OrderBy: Prisma.VehicleAssessmentOrderByWithRelationInput;
        WhereUnique: Prisma.VehicleAssessmentWhereUniqueInput;
        Where: Prisma.VehicleAssessmentWhereInput;
        Create: {};
        Update: {};
        RelationName: "vehicleDetails" | "conditionIssues";
        ListRelations: "conditionIssues";
        Relations: {
            vehicleDetails: {
                Shape: VehicleDetails;
                Name: "VehicleDetails";
                Nullable: false;
            };
            conditionIssues: {
                Shape: ConditionIssue[];
                Name: "ConditionIssue";
                Nullable: false;
            };
        };
    };
    VehicleDetails: {
        Name: "VehicleDetails";
        Shape: VehicleDetails;
        Include: Prisma.VehicleDetailsInclude;
        Select: Prisma.VehicleDetailsSelect;
        OrderBy: Prisma.VehicleDetailsOrderByWithRelationInput;
        WhereUnique: Prisma.VehicleDetailsWhereUniqueInput;
        Where: Prisma.VehicleDetailsWhereInput;
        Create: {};
        Update: {};
        RelationName: "VehicleAssessment";
        ListRelations: "VehicleAssessment";
        Relations: {
            VehicleAssessment: {
                Shape: VehicleAssessment[];
                Name: "VehicleAssessment";
                Nullable: false;
            };
        };
    };
    ConditionIssue: {
        Name: "ConditionIssue";
        Shape: ConditionIssue;
        Include: Prisma.ConditionIssueInclude;
        Select: Prisma.ConditionIssueSelect;
        OrderBy: Prisma.ConditionIssueOrderByWithRelationInput;
        WhereUnique: Prisma.ConditionIssueWhereUniqueInput;
        Where: Prisma.ConditionIssueWhereInput;
        Create: {};
        Update: {};
        RelationName: "vehicleAssessment";
        ListRelations: never;
        Relations: {
            vehicleAssessment: {
                Shape: VehicleAssessment;
                Name: "VehicleAssessment";
                Nullable: false;
            };
        };
    };
    VinSubmission: {
        Name: "VinSubmission";
        Shape: VinSubmission;
        Include: never;
        Select: Prisma.VinSubmissionSelect;
        OrderBy: Prisma.VinSubmissionOrderByWithRelationInput;
        WhereUnique: Prisma.VinSubmissionWhereUniqueInput;
        Where: Prisma.VinSubmissionWhereInput;
        Create: {};
        Update: {};
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
}
import { builder } from "../../graphql/builder";
import { prisma } from "../../lib/prisma";

builder.prismaObject("VehicleAssessment", {
  name: "VehicleAssessment",
  fields: (t) => ({
    id: t.exposeID("id"),
    vehicleDetails: t.relation("vehicleDetails"),
    conditionIssues: t.relation("conditionIssues"),
    marketValueRange: t.exposeString("marketValueRange"),
    tradeInValue: t.exposeString("tradeInValue"),
    visualScore: t.exposeInt("visualScore"),
    maxScore: t.exposeInt("maxScore"),
    scoreDescription: t.exposeString("scoreDescription"),
    tradeInDescription: t.exposeString("tradeInDescription"),
    aiConfidence: t.exposeInt("aiConfidence"),
    aiConfidenceDescription: t.exposeString("aiConfidenceDescription"),
  }),
});

builder.prismaObject("VehicleDetails", {
  name: "VehicleDetails",
  fields: (t) => ({
    id: t.exposeID("id"),
    vin: t.exposeString("vin"),
    make: t.exposeString("make"),
    model: t.exposeString("model"),
    year: t.exposeInt("year"),
    vehicleAssessment: t.relation("VehicleAssessment"),
  }),
});

builder.prismaObject("ConditionIssue", {
  name: "ConditionIssue",
  fields: (t) => ({
    id: t.exposeID("id"),
    issueKey: t.exposeString("issueKey"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    icon: t.exposeString("icon"),
    vehicleAssessment: t.relation("vehicleAssessment"),
  }),
});

builder.queryField("vehicleAssessment", (t) =>
  t.prismaField({
    type: "VehicleAssessment",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, root, args, context, info) => {
      const assessment = await prisma.vehicleAssessment.findUnique({
        where: { id: String(args.id) },
        ...query,
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      return assessment;
    },
  }),
);
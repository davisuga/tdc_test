import { builder } from "../../graphql/builder";
import { s3Client } from "../../lib/s3";
import * as VinSubmissionService from "./service";
import { generatePresignedUrls } from "./service";

builder.prismaObject("VinSubmission", {
  name: "VinSubmission",
  fields: (t) => ({
    id: t.exposeID("id"),
    vin: t.exposeString("vin"),
    description: t.exposeString("description", { nullable: true }),
    mileage: t.exposeInt("mileage", { nullable: true }),
    s3Paths: t.exposeStringList("s3Paths"),
    vehicleAssessment: t.relation("vehicleAssessment"),
  }),
});

const SignedUrl = builder.objectRef<{ url: string }>("SignedUrl").implement({
  fields: (t) => ({
    url: t.exposeString("url"),
  }),
});

builder.mutationField("generateUploadUrls", (t) =>
  t.field({
    type: [SignedUrl],
    args: {
      filenames: t.arg.stringList({ required: true }),
    },
    resolve: async (root, args, context, info) => {
      const { filenames } = args;
      return generatePresignedUrls(filenames);
    },
  }),
);

builder.mutationField("createVinSubmission", (t) =>
  t.prismaField({
    type: "VinSubmission",
    args: {
      vin: t.arg.string({ required: true }),
      description: t.arg.string({ required: false }),
      mileage: t.arg.int({ required: false }),
      s3Paths: t.arg.stringList({ required: true }),
    },
    resolve: async (query, root, args, context, info) => {
      return VinSubmissionService.create(args);
    },
  }),
);

builder.queryField("getSubmission", (t) =>
  t.prismaField({
    type: "VinSubmission",
    args: { id: t.arg.id({ required: true }) },
    resolve: async (query, root, args) => {
      const submission = await VinSubmissionService.getById(args.id);
      if (!submission) {
        throw new Error("Submission not found");
      }
      return submission;
    },
  }),
);


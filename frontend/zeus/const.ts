/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Mutation:{
		createVinSubmission:{

		},
		generateUploadUrls:{

		}
	},
	ID: `scalar.ID` as const
}

export const ReturnTypes: Record<string,any> = {
	Mutation:{
		createVinSubmission:"VinSubmission",
		generateUploadUrls:"SignedUrl"
	},
	Query:{
		hello:"String"
	},
	SignedUrl:{
		url:"String"
	},
	VinSubmission:{
		createdAt:"String",
		description:"String",
		id:"ID",
		s3Paths:"String",
		updatedAt:"String",
		vin:"String"
	},
	ID: `scalar.ID` as const
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}
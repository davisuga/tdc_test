/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Mutation:{
		createVinSubmission:{

		},
		generateUploadUrls:{

		}
	},
	Query:{
		getSubmission:{

		},
		vehicleAssessment:{

		}
	},
	ID: `scalar.ID` as const
}

export const ReturnTypes: Record<string,any> = {
	ConditionIssue:{
		description:"String",
		icon:"String",
		id:"ID",
		issueKey:"String",
		title:"String",
		vehicleAssessment:"VehicleAssessment"
	},
	Mutation:{
		createVinSubmission:"VinSubmission",
		generateUploadUrls:"SignedUrl"
	},
	Query:{
		getSubmission:"VinSubmission",
		vehicleAssessment:"VehicleAssessment"
	},
	SignedUrl:{
		url:"String"
	},
	VehicleAssessment:{
		aiConfidence:"Int",
		aiConfidenceDescription:"String",
		conditionIssues:"ConditionIssue",
		id:"ID",
		marketValueRange:"String",
		tradeInDescription:"String",
		tradeInValue:"String",
		vehicleDetails:"VehicleDetails"
	},
	VehicleDetails:{
		id:"ID",
		make:"String",
		model:"String",
		vehicleAssessment:"VehicleAssessment",
		vin:"String",
		year:"Int"
	},
	VinSubmission:{
		description:"String",
		id:"ID",
		mileage:"Int",
		s3Paths:"String",
		vin:"String"
	},
	ID: `scalar.ID` as const
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}
import { validateDefinition } from "@team4909/bionic-sign";
import { getAgeOnDate, getOwnedFields } from "$lib/server/formWorkflow";

export function getStandaloneAssignmentStatus(
	id: string,
	name: string,
	definitionValue: unknown,
	studentSubmittedAt: Date | null,
	parentCompletedAt: Date | null,
	storedParentRequired: boolean | null,
	dateOfBirth: string | null,
	now = new Date()
) {
	const definition = validateDefinition(definitionValue);
	const parentRequired =
		studentSubmittedAt && storedParentRequired !== null
			? storedParentRequired
			: getOwnedFields(definition, "parent").some((field) => field.required) &&
				(!dateOfBirth || getAgeOnDate(dateOfBirth, now) < 18);
	const studentSubmitted = Boolean(studentSubmittedAt);
	return {
		id,
		name,
		studentSubmitted,
		parentRequired,
		submitted: studentSubmitted && (!parentRequired || Boolean(parentCompletedAt))
	};
}

export function isFreeEvent(cost: number): boolean {
	return cost <= 0;
}

export function requiresPayment(cost: number, paid: boolean): boolean {
	return !isFreeEvent(cost) && !paid;
}

export function getEventCostLabel(cost: number): string {
	return isFreeEvent(cost) ? "Free" : `$${cost.toFixed(2)}`;
}

export function getPaymentStatusLabel(cost: number, paid: boolean): string {
	if (isFreeEvent(cost)) return "Free";
	return paid ? "Paid ✓" : "Unpaid";
}

import { describe, expect, it } from "vitest";
import { getEventCostLabel, getPaymentStatusLabel, isFreeEvent, requiresPayment } from "./eventPricing";

describe("event pricing", () => {
	it("treats zero and negative costs as free events", () => {
		expect(isFreeEvent(0)).toBe(true);
		expect(isFreeEvent(-1)).toBe(true);
		expect(isFreeEvent(25)).toBe(false);
	});

	it("labels free events as Free regardless of registration payment state", () => {
		expect(getEventCostLabel(0)).toBe("Free");
		expect(getPaymentStatusLabel(0, true)).toBe("Free");
		expect(getPaymentStatusLabel(0, false)).toBe("Free");
	});

	it("keeps paid-event payment statuses distinct", () => {
		expect(getEventCostLabel(25)).toBe("$25.00");
		expect(getPaymentStatusLabel(25, true)).toBe("Paid ✓");
		expect(getPaymentStatusLabel(25, false)).toBe("Unpaid");
	});

	it("never requires payment for a free event", () => {
		expect(requiresPayment(0, false)).toBe(false);
		expect(requiresPayment(-1, false)).toBe(false);
		expect(requiresPayment(25, false)).toBe(true);
		expect(requiresPayment(25, true)).toBe(false);
	});
});

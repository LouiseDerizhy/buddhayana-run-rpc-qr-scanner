export function validateBib(
    value: string,
    startRange: number,
    endRange: number,
) {
    if (!/^\d{4}$/.test(value)) {
        return false;
    }

    const number = Number(value);
    return number >= startRange && number <= endRange;
}

export function formatDateTime(isoString: string) {
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date(isoString));
}

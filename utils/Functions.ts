export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    // Ensure the date string is in a format that the Date constructor can parse reliably,
    // or use a date library if you face cross-browser issues.
    // MySQL's TIMESTAMP 'YYYY-MM-DD HH:MM:SS' is generally well-parsed.
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric", // 'numeric' or '2-digit'
      month: "long", // 'numeric', '2-digit', 'long', 'short', 'narrow'
      day: "numeric", // 'numeric' or '2-digit'
      hour: "2-digit", // 'numeric' or '2-digit'
      minute: "2-digit", // 'numeric' or '2-digit'
    };
    return new Date(dateString.replace(" ", "T")).toLocaleDateString(
      undefined,
      options
    ); // 'T' helps parsing in some JS engines
  } catch (e) {
    return dateString; // Return original if date is invalid
  }
};

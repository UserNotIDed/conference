/**
 * The one string that stands in for a value we do not have.
 *
 * It used to be an em dash in fourteen places. One constant instead, so a
 * table cell that reads "n/a" always means "they never answered" and never
 * means "something upstream broke and printed a dash".
 */
export const EMPTY = "n/a";

export function preventJobCodeAutoLinking(jobCode: string): string {
  return jobCode
    .replace(/(\d)([-/.])(?=\d)/g, "$1\u2060$2\u2060")
    .replace(/(\d)(?=\d)/g, "$1\u2060");
}

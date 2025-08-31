
// Automated Mock Data Detection
const mockDataPatterns = [
  /Test Worker/,
  /test..*@replit.dev/,
  /T12345/,
  /mock/i,
  /placeholder/i,
  /demo/i
];

export async function detectMockDataInResponse(response: any): Promise<string[]> {
  const violations: string[] = [];
  const responseStr = JSON.stringify(response);
  
  mockDataPatterns.forEach((pattern, index) => {
    if (pattern.test(responseStr)) {
      violations.push(`Mock data pattern ${index + 1} detected`);
    }
  });
  
  return violations;
}

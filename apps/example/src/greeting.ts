export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return `Good ${timeOfDay}, ${name}!`;
}

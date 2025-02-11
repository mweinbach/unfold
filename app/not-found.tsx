export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-lg">Sorry, we couldn’t find the page you’re looking for.</p>
      </div>
    </div>
  );
}
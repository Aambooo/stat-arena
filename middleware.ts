// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that do NOT require login
const isPublicRoute = createRouteMatcher([
  "/",                // homepage
  "/player(.*)",      // player pages
  "/team(.*)",        // team pages
  "/advertise(.*)",   // advertise page
  "/admin/login(.*)", // admin login (must stay public)
  "/api(.*)",         // api routes (public for now)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

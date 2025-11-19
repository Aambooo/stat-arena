import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",                
  "/player(.*)",      
  "/team(.*)",        
  "/advertise(.*)",   
  
  // Auth routes MUST be public for Google OAuth to work
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",

  "/admin/login(.*)",  
  "/api(.*)",           
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

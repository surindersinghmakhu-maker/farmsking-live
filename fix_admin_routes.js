const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, 'admin/app/_layout.tsx');
let layoutCode = fs.readFileSync(layoutPath, 'utf8');

// Update routing logic to ONLY allow admins.
// We'll replace the existing routing logic with a strict admin-only check.

const newRoutingLogic = 
      if (user) {
        const userRoles = [user.role, ...(user.roles || [])];
        const hasAdminAccess = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'MANAGER', 'SUPERVISOR'].includes(r));
        if (!hasAdminAccess) {
          alert('You are not authorized to access the Admin Panel.');
          // Redirect back to login or just stick on auth
          router.replace('/(auth)/login');
        } else {
          // If they are an admin, redirect them to the admin dashboard
          // only if they are on a public/auth route
          if (inAuthGroup || isRootRoute) {
            router.replace('/admin/(tabs)');
          }
        }
      }
;

layoutCode = layoutCode.replace(/if \(!user && !inAuthGroup && !isPublicRoute\) \{[\s\S]*?\} else if \(user\) \{[\s\S]*?\}\n    \}/, 
    if (!user && !inAuthGroup && !isPublicRoute) { router.replace('/(auth)/login'); } else );

fs.writeFileSync(layoutPath, layoutCode);
console.log('Updated _layout.tsx');

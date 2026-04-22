# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.



# AI RULES FOR REMOTION PROJECT

When generating a new animation component:

1. Create a React component file in:
   src/components/<ComponentName>.tsx

2. The component name and file name MUST match exactly
   (e.g., MyIntro.tsx exports MyIntro)

3. After creating the component, append an entry to:
   src/templates.json
   Example:
   {
     "name": "MyIntro",
     "durationInFrames": 90
   }

4. Do NOT modify:
   - src/AutoTimeline.tsx
   - src/Root.tsx
   - any files inside HelloWorld/

5. Components MUST follow this structure:
   export const ComponentName: React.FC = () => {
     return (<div>...</div>);
   };

6. Never delete existing entries.



DYAD RULES FOR REMOTION:
1. Only create files in `src/components/`
2. Always create an `index.ts` file that exports all components
3. Never modify `AutoTimeline.tsx` or `Root.tsx`
4. Only update `templates.json` by adding new entries
5. Components must not require props, or must have sensible defaults
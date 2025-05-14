// tailwind.config.js
import { shadcn } from '@shadcn/ui/tailwind'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/ui/**/*.{js,ts,jsx,tsx}',  // ← your generated shadcn components
  ],
  theme: {
    extend: {},
  },
  plugins: [
    shadcn(),  // ← adds the tiny utilities that shadcn/ui components rely on
  ],
}

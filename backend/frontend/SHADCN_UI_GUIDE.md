# 🎨 Shadcn/ui Integration Guide for Vistapro

## ✨ **What is Shadcn/ui?**

Shadcn/ui is a collection of beautifully designed, accessible components built on top of Tailwind CSS and Radix UI. It provides:

- **Modern Design System** - Professional, clean components
- **Accessibility First** - Built on Radix UI primitives
- **Tailwind Integration** - Seamless CSS utility classes
- **Copy-Paste Components** - No heavy dependencies
- **Customizable** - Easy to match your brand

## 🚀 **Installation Status**

✅ **Completed Setup:**
- Shadcn/ui components installed
- Tailwind CSS configured with CSS variables
- Utility functions created
- Path aliases configured
- Demo components created

## 📁 **Project Structure**

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn/ui components
│   │   │   ├── button.jsx         # Button component
│   │   │   ├── card.jsx           # Card components
│   │   │   ├── input.jsx          # Input component
│   │   │   └── index.js           # Component exports
│   │   └── ShadcnDemo.jsx         # Demo showcase
│   ├── lib/
│   │   └── utils.js               # Utility functions
│   └── index.css                  # CSS variables & Tailwind
├── components.json                 # Shadcn/ui configuration
├── tailwind.config.js             # Tailwind + Shadcn/ui config
└── vite.config.js                 # Path aliases
```

## 🎯 **Available Components**

### **Button Component**
```jsx
import { Button } from '@/components/ui'

// Variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

### **Card Components**
```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### **Input Component**
```jsx
import { Input } from '@/components/ui'

<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Enter password" />
<Input placeholder="Enter text" />
```

## 🎨 **Customization**

### **CSS Variables**
The components use CSS variables defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... more variables */
}
```

### **Theme Colors**
- **Primary**: Blue (#3b82f6)
- **Secondary**: Light gray (#f1f5f9)
- **Accent**: Light blue (#eff6ff)
- **Muted**: Gray (#f8fafc)
- **Destructive**: Red (#ef4444)

### **Dark Mode Support**
Dark mode classes are available and can be toggled:

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark theme variables */
}
```

## 🔧 **Adding New Components**

### **1. Install from Shadcn/ui CLI**
```bash
npx shadcn@latest add [component-name]
```

### **2. Manual Installation**
1. Copy component code from [shadcn/ui website](https://ui.shadcn.com/)
2. Place in `src/components/ui/`
3. Update `src/components/ui/index.js`
4. Import and use in your components

### **3. Example: Adding Badge Component**
```jsx
// src/components/ui/badge.jsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80": variant === "destructive",
          "border-transparent bg-outline text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
```

## 📱 **Responsive Design**

All components are built with responsive design in mind:

```jsx
// Responsive grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Content</Card>
  <Card>Content</Card>
  <Card>Content</Card>
</div>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>
```

## ♿ **Accessibility Features**

- **Keyboard Navigation** - All interactive elements are keyboard accessible
- **Screen Reader Support** - Proper ARIA labels and roles
- **Focus Management** - Visible focus indicators
- **Semantic HTML** - Proper heading hierarchy and landmarks

## 🎭 **Usage Examples**

### **Dashboard Layout**
```jsx
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

const DashboardCard = ({ title, value, description, action }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
    {action && (
      <CardFooter>
        <Button className="w-full">{action}</Button>
      </CardFooter>
    )}
  </Card>
)
```

### **Form Layout**
```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Input, Button } from '@/components/ui'

const LoginForm = () => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="Enter your email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" placeholder="Enter your password" />
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full">Sign In</Button>
    </CardFooter>
  </Card>
)
```

## 🚀 **Next Steps**

1. **Explore Components** - Visit [shadcn/ui website](https://ui.shadcn.com/)
2. **Customize Theme** - Modify CSS variables in `index.css`
3. **Add More Components** - Install additional components as needed
4. **Create Custom Variants** - Extend existing components
5. **Build Your UI** - Start building beautiful interfaces!

## 📚 **Resources**

- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Component Examples](https://ui.shadcn.com/examples)

---

**Happy Coding! 🎉**
Your Vistapro application now has access to beautiful, professional UI components!

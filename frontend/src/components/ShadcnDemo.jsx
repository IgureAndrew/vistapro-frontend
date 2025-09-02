import React from 'react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input } from './ui'

const ShadcnDemo = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🎨 Shadcn/ui Components Demo
          </h1>
          <p className="text-xl text-gray-600">
            Beautiful, accessible components for your Vistapro application
          </p>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>
              Different button styles and sizes available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🔍</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Input Components</CardTitle>
            <CardDescription>
              Form inputs with consistent styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input type="password" placeholder="Enter your password" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <Input placeholder="Enter your full name" />
            </div>
          </CardContent>
        </Card>

        {/* Card Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature 1</CardTitle>
              <CardDescription>
                This is a beautiful card component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Cards are perfect for displaying content in organized sections.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Learn More</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature 2</CardTitle>
              <CardDescription>
                Responsive and accessible design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built with accessibility in mind and fully responsive.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Get Started</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature 3</CardTitle>
              <CardDescription>
                Customizable and themeable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Easy to customize colors and themes to match your brand.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full">Explore</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>
              Available CSS variables for consistent theming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 w-full rounded bg-blue-600"></div>
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded bg-gray-200"></div>
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded bg-blue-100"></div>
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-full rounded bg-gray-100"></div>
                <p className="text-sm font-medium">Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ShadcnDemo

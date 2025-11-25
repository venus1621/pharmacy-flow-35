import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Check, Building2, Users, TrendingUp, Shield, BarChart3, Zap, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/pharmacy-hero-bg.jpg";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "owner") {
        navigate("/owner");
      } else if (profile.role === "pharmacist") {
        navigate("/pharmacist");
      }
    }
  }, [user, profile, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);

    try {
      const result = await authApi.signIn({
        email: signInData.email,
        password: signInData.password,
      });

      toast.success("Signed in successfully!");
      setDialogOpen(false);
      const redirectPath = result.user.role === "owner" ? "/owner" : "/pharmacist";
      navigate(redirectPath);
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast.error("Google sign-in is not available with MongoDB backend. Please use email/password authentication.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    { icon: Building2, title: "Multi-Branch Management", description: "Manage multiple pharmacy locations from one central system" },
    { icon: BarChart3, title: "Real-Time Analytics", description: "Track sales, inventory, and performance with live dashboards" },
    { icon: Shield, title: "Smart Alerts", description: "Automated notifications for low stock and expiring medicines" },
    { icon: Users, title: "Staff Management", description: "Assign pharmacists to branches and monitor their activities" },
    { icon: TrendingUp, title: "Sales Tracking", description: "Complete transaction history and revenue reports" },
    { icon: Zap, title: "Fast POS System", description: "Quick and efficient point-of-sale for busy pharmacy operations" },
  ];

  const plans = [
    {
      name: "Small Business",
      price: "1,999",
      period: "ETB/month",
      description: "Perfect for growing pharmacies",
      features: [
        "Up to 2 Branches",
        "Up to 6 Pharmacists",
        "Inventory Management",
        "Real-Time Alerts",
        "Sales Analytics",
        "24/7 Support",
      ],
      popular: false,
    },
    {
      name: "Enterprise",
      price: "3,000",
      period: "ETB/month",
      description: "For established pharmacy chains",
      features: [
        "Up to 5 Branches",
        "Up to 15 Pharmacists",
        "Advanced Analytics",
        "Priority Support",
        "Custom Reports",
        "API Access",
        "Dedicated Account Manager",
      ],
      popular: true,
    },
    {
      name: "Custom",
      price: "Contact Us",
      period: "",
      description: "Tailored to your needs",
      features: [
        "Unlimited Branches",
        "Unlimited Pharmacists",
        "Custom Features",
        "On-Premise Deployment",
        "Custom Integrations",
        "SLA Guarantee",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            filter: 'brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/40" />
        
        <div className="relative z-10 text-center max-w-5xl px-4 py-20">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent mb-8 shadow-2xl">
            <ShoppingCart className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
            Gebeta Pharmacy
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-accent drop-shadow-md">
            Smart Management System
          </h2>
          <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Transform your pharmacy operations with our comprehensive solution. Manage inventory, track sales, monitor stock levels, and grow your business with powerful analytics.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-lg px-10 py-6 shadow-2xl">
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sign In to Your Account</DialogTitle>
                  <DialogDescription>
                    Enter your credentials to access your dashboard
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      <Lock className="inline h-4 w-4 mr-2" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={signingIn}>
                    {signingIn ? "Signing in..." : "Sign In with Email"}
                  </Button>
                </form>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </DialogContent>
            </Dialog>

            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/pharmacy-setup")} 
              className="text-lg px-10 py-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              Create Your Pharmacy
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run a modern, efficient pharmacy business
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your pharmacy's needs. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary shadow-xl shadow-primary/20 scale-105' : 'border-border/50'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="mb-6">{plan.description}</CardDescription>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground ml-2">{plan.period}</span>}
                  </div>
                  <Button 
                    onClick={() => {
                      const planValue = plan.name === "Small Business" ? "small_business" : 
                                       plan.name === "Enterprise" ? "enterprise" : "custom";
                      navigate(`/pharmacy-setup?plan=${planValue}`);
                    }}
                    className={plan.popular ? "w-full" : "w-full"}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Pharmacy?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join hundreds of pharmacies already using Gebeta Pharmacy Management System
          </p>
          <Button size="lg" onClick={() => navigate("/pharmacy-setup?plan=small_business")} className="text-lg px-12 py-6">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Gebeta Pharmacy Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Clock,
  Coffee,
  FileText,
  Calendar,
  Monitor,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  BREAK_SETTINGS,
  SHIFT_SETTINGS,
  INVOICE_SETTINGS,
  LEAVE_SETTINGS,
  KIOSK_SETTINGS,
  updateBreakSettings,
  updateShiftSettings,
  updateInvoiceSettings,
  updateLeaveSettings,
  updateKioskSettings,
} from '@/lib/settings';

export default function CompanySettings() {
  const navigate = useNavigate();
  const { profile } = useAuthContext();

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  // Break Settings State
  const [breakSettings, setBreakSettings] = useState({
    breaksArePaid: BREAK_SETTINGS.BREAKS_ARE_PAID,
    minHoursBeforeBreak: BREAK_SETTINGS.MIN_HOURS_BEFORE_BREAK,
    defaultBreakMinutes: BREAK_SETTINGS.DEFAULT_BREAK_MINUTES,
    maxBreakMinutes: BREAK_SETTINGS.MAX_BREAK_MINUTES,
    allowMultipleBreaks: BREAK_SETTINGS.ALLOW_MULTIPLE_BREAKS,
    autoDeductBreakAfterHours: BREAK_SETTINGS.AUTO_DEDUCT_BREAK_AFTER_HOURS,
    autoDeductBreakMinutes: BREAK_SETTINGS.AUTO_DEDUCT_BREAK_MINUTES,
  });

  // Shift Settings State
  const [shiftSettings, setShiftSettings] = useState({
    standardHoursPerDay: SHIFT_SETTINGS.STANDARD_HOURS_PER_DAY,
    standardHoursPerWeek: SHIFT_SETTINGS.STANDARD_HOURS_PER_WEEK,
    overtimeMultiplier: SHIFT_SETTINGS.OVERTIME_MULTIPLIER,
    weekendOvertimeMultiplier: SHIFT_SETTINGS.WEEKEND_OVERTIME_MULTIPLIER,
    minShiftDurationMinutes: SHIFT_SETTINGS.MIN_SHIFT_DURATION_MINUTES,
    maxShiftDurationHours: SHIFT_SETTINGS.MAX_SHIFT_DURATION_HOURS,
    requireClockInPhoto: SHIFT_SETTINGS.REQUIRE_CLOCK_IN_PHOTO,
    requireClockOutPhoto: SHIFT_SETTINGS.REQUIRE_CLOCK_OUT_PHOTO,
    allowClockInWithoutPin: SHIFT_SETTINGS.ALLOW_CLOCK_IN_WITHOUT_PIN,
    roundShiftTimesToMinutes: SHIFT_SETTINGS.ROUND_SHIFT_TIMES_TO_MINUTES,
  });

  // Invoice Settings State
  const [invoiceSettings, setInvoiceSettings] = useState({
    companyName: INVOICE_SETTINGS.COMPANY_NAME,
    companyAddress: INVOICE_SETTINGS.COMPANY_ADDRESS,
    companyWebsite: INVOICE_SETTINGS.COMPANY_WEBSITE,
    companyEmail: INVOICE_SETTINGS.COMPANY_EMAIL,
    companyPhone: INVOICE_SETTINGS.COMPANY_PHONE,
    invoicePrefix: INVOICE_SETTINGS.INVOICE_PREFIX,
    paymentTermsDays: INVOICE_SETTINGS.PAYMENT_TERMS_DAYS,
    taxRate: INVOICE_SETTINGS.TAX_RATE,
    taxNote: INVOICE_SETTINGS.TAX_NOTE,
    currencySymbol: INVOICE_SETTINGS.CURRENCY_SYMBOL,
    currencyCode: INVOICE_SETTINGS.CURRENCY_CODE,
  });

  // Leave Settings State
  const [leaveSettings, setLeaveSettings] = useState({
    annualLeaveDays: LEAVE_SETTINGS.ANNUAL_LEAVE_DAYS,
    allowLeaveCarryOver: LEAVE_SETTINGS.ALLOW_LEAVE_CARRY_OVER,
    maxCarryOverDays: LEAVE_SETTINGS.MAX_CARRY_OVER_DAYS,
    requireLeaveApproval: LEAVE_SETTINGS.REQUIRE_LEAVE_APPROVAL,
    minNoticeDays: LEAVE_SETTINGS.MIN_NOTICE_DAYS,
    allowHalfDayLeave: LEAVE_SETTINGS.ALLOW_HALF_DAY_LEAVE,
  });

  // Kiosk Settings State
  const [kioskSettings, setKioskSettings] = useState({
    appName: KIOSK_SETTINGS.APP_NAME,
    appTagline: KIOSK_SETTINGS.APP_TAGLINE,
    footerCompanyName: KIOSK_SETTINGS.FOOTER_COMPANY_NAME,
    showVisitorSignIn: KIOSK_SETTINGS.SHOW_VISITOR_SIGN_IN,
    autoLogoutSeconds: KIOSK_SETTINGS.AUTO_LOGOUT_SECONDS,
    showDepartment: KIOSK_SETTINGS.SHOW_DEPARTMENT,
    showPosition: KIOSK_SETTINGS.SHOW_POSITION,
    pinLength: KIOSK_SETTINGS.PIN_LENGTH,
    showClock: KIOSK_SETTINGS.SHOW_CLOCK,
    use24HourTime: KIOSK_SETTINGS.USE_24_HOUR_TIME,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (profile && !isAdmin) {
      toast.error('Access denied. Admin role required.');
      navigate('/');
    }
  }, [profile, isAdmin, navigate]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Update all settings in the runtime store
      updateBreakSettings({
        BREAKS_ARE_PAID: breakSettings.breaksArePaid,
        MIN_HOURS_BEFORE_BREAK: breakSettings.minHoursBeforeBreak,
        DEFAULT_BREAK_MINUTES: breakSettings.defaultBreakMinutes,
        MAX_BREAK_MINUTES: breakSettings.maxBreakMinutes,
        ALLOW_MULTIPLE_BREAKS: breakSettings.allowMultipleBreaks,
        AUTO_DEDUCT_BREAK_AFTER_HOURS: breakSettings.autoDeductBreakAfterHours,
        AUTO_DEDUCT_BREAK_MINUTES: breakSettings.autoDeductBreakMinutes,
      });

      updateShiftSettings({
        STANDARD_HOURS_PER_DAY: shiftSettings.standardHoursPerDay,
        STANDARD_HOURS_PER_WEEK: shiftSettings.standardHoursPerWeek,
        OVERTIME_MULTIPLIER: shiftSettings.overtimeMultiplier,
        WEEKEND_OVERTIME_MULTIPLIER: shiftSettings.weekendOvertimeMultiplier,
        MIN_SHIFT_DURATION_MINUTES: shiftSettings.minShiftDurationMinutes,
        MAX_SHIFT_DURATION_HOURS: shiftSettings.maxShiftDurationHours,
        REQUIRE_CLOCK_IN_PHOTO: shiftSettings.requireClockInPhoto,
        REQUIRE_CLOCK_OUT_PHOTO: shiftSettings.requireClockOutPhoto,
        ALLOW_CLOCK_IN_WITHOUT_PIN: shiftSettings.allowClockInWithoutPin,
        ROUND_SHIFT_TIMES_TO_MINUTES: shiftSettings.roundShiftTimesToMinutes,
      });

      updateInvoiceSettings({
        COMPANY_NAME: invoiceSettings.companyName,
        COMPANY_ADDRESS: invoiceSettings.companyAddress,
        COMPANY_WEBSITE: invoiceSettings.companyWebsite,
        COMPANY_EMAIL: invoiceSettings.companyEmail,
        COMPANY_PHONE: invoiceSettings.companyPhone,
        INVOICE_PREFIX: invoiceSettings.invoicePrefix,
        PAYMENT_TERMS_DAYS: invoiceSettings.paymentTermsDays,
        TAX_RATE: invoiceSettings.taxRate,
        TAX_NOTE: invoiceSettings.taxNote,
        CURRENCY_SYMBOL: invoiceSettings.currencySymbol,
        CURRENCY_CODE: invoiceSettings.currencyCode,
      });

      updateLeaveSettings({
        ANNUAL_LEAVE_DAYS: leaveSettings.annualLeaveDays,
        ALLOW_LEAVE_CARRY_OVER: leaveSettings.allowLeaveCarryOver,
        MAX_CARRY_OVER_DAYS: leaveSettings.maxCarryOverDays,
        REQUIRE_LEAVE_APPROVAL: leaveSettings.requireLeaveApproval,
        MIN_NOTICE_DAYS: leaveSettings.minNoticeDays,
        ALLOW_HALF_DAY_LEAVE: leaveSettings.allowHalfDayLeave,
      });

      updateKioskSettings({
        APP_NAME: kioskSettings.appName,
        APP_TAGLINE: kioskSettings.appTagline,
        FOOTER_COMPANY_NAME: kioskSettings.footerCompanyName,
        SHOW_VISITOR_SIGN_IN: kioskSettings.showVisitorSignIn,
        AUTO_LOGOUT_SECONDS: kioskSettings.autoLogoutSeconds,
        SHOW_DEPARTMENT: kioskSettings.showDepartment,
        SHOW_POSITION: kioskSettings.showPosition,
        PIN_LENGTH: kioskSettings.pinLength,
        SHOW_CLOCK: kioskSettings.showClock,
        USE_24_HOUR_TIME: kioskSettings.use24HourTime,
      });

      toast.success('Settings saved successfully! Changes will take effect immediately.');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need Admin privileges to access Company Settings.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Company Settings</h1>
                  <p className="text-sm text-muted-foreground">Configure system defaults and company information</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                  Unsaved Changes
                </Badge>
              )}
              <Button onClick={handleSaveAll} disabled={isSaving || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="company" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white border shadow-sm">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white border shadow-sm">
              <Clock className="h-4 w-4 mr-2" />
              Shifts
            </TabsTrigger>
            <TabsTrigger value="breaks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white border shadow-sm">
              <Coffee className="h-4 w-4 mr-2" />
              Breaks
            </TabsTrigger>
            <TabsTrigger value="leave" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white border shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Leave
            </TabsTrigger>
            <TabsTrigger value="kiosk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-white border shadow-sm">
              <Monitor className="h-4 w-4 mr-2" />
              Kiosk
            </TabsTrigger>
          </TabsList>

          {/* Company / Invoice Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Your company details used for invoices and official documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={invoiceSettings.companyName}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, companyName: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={invoiceSettings.companyPhone}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, companyPhone: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={invoiceSettings.companyEmail}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, companyEmail: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={invoiceSettings.companyWebsite}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, companyWebsite: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <textarea
                      value={invoiceSettings.companyAddress}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, companyAddress: e.target.value });
                        setHasChanges(true);
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Settings
                </CardTitle>
                <CardDescription>
                  Configure invoice defaults and payment terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input
                      value={invoiceSettings.invoicePrefix}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="e.g., INV-"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank for no prefix</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms (Days)</Label>
                    <Input
                      type="number"
                      value={invoiceSettings.paymentTermsDays}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, paymentTermsDays: parseInt(e.target.value) || 0 });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceSettings.taxRate * 100}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, taxRate: (parseFloat(e.target.value) || 0) / 100 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Enter 20 for 20% VAT</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Symbol</Label>
                    <Input
                      value={invoiceSettings.currencySymbol}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, currencySymbol: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Code</Label>
                    <Input
                      value={invoiceSettings.currencyCode}
                      onChange={(e) => {
                        setInvoiceSettings({ ...invoiceSettings, currencyCode: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tax Note</Label>
                  <textarea
                    value={invoiceSettings.taxNote}
                    onChange={(e) => {
                      setInvoiceSettings({ ...invoiceSettings, taxNote: e.target.value });
                      setHasChanges(true);
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Displayed at the bottom of invoices</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shift Settings */}
          <TabsContent value="shifts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Working Hours
                </CardTitle>
                <CardDescription>
                  Configure standard working hours and overtime rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>Standard Hours/Day</Label>
                    <Input
                      type="number"
                      value={shiftSettings.standardHoursPerDay}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, standardHoursPerDay: parseInt(e.target.value) || 8 });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Hours/Week</Label>
                    <Input
                      type="number"
                      value={shiftSettings.standardHoursPerWeek}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, standardHoursPerWeek: parseInt(e.target.value) || 40 });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Overtime Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={shiftSettings.overtimeMultiplier}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, overtimeMultiplier: parseFloat(e.target.value) || 1.5 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">1.5 = time and a half</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Weekend Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={shiftSettings.weekendOvertimeMultiplier}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, weekendOvertimeMultiplier: parseFloat(e.target.value) || 2.0 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">2.0 = double time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shift Rules</CardTitle>
                <CardDescription>
                  Set minimum and maximum shift durations and other rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Min Shift Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={shiftSettings.minShiftDurationMinutes}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, minShiftDurationMinutes: parseInt(e.target.value) || 15 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Prevents accidental clock-ins</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Shift Duration (hours)</Label>
                    <Input
                      type="number"
                      value={shiftSettings.maxShiftDurationHours}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, maxShiftDurationHours: parseInt(e.target.value) || 16 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Safety limit</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Round Times To (minutes)</Label>
                    <Input
                      type="number"
                      value={shiftSettings.roundShiftTimesToMinutes}
                      onChange={(e) => {
                        setShiftSettings({ ...shiftSettings, roundShiftTimesToMinutes: parseInt(e.target.value) || 0 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">0 = no rounding, 15 = quarter hour</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Verification Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Require Clock-In Photo</Label>
                        <p className="text-xs text-muted-foreground">Photo verification when signing in</p>
                      </div>
                      <Switch
                        checked={shiftSettings.requireClockInPhoto}
                        onCheckedChange={(checked) => {
                          setShiftSettings({ ...shiftSettings, requireClockInPhoto: checked });
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Require Clock-Out Photo</Label>
                        <p className="text-xs text-muted-foreground">Photo verification when signing out</p>
                      </div>
                      <Switch
                        checked={shiftSettings.requireClockOutPhoto}
                        onCheckedChange={(checked) => {
                          setShiftSettings({ ...shiftSettings, requireClockOutPhoto: checked });
                          setHasChanges(true);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Allow Clock-In Without PIN</Label>
                        <p className="text-xs text-muted-foreground">For secure kiosk locations</p>
                      </div>
                      <Switch
                        checked={shiftSettings.allowClockInWithoutPin}
                        onCheckedChange={(checked) => {
                          setShiftSettings({ ...shiftSettings, allowClockInWithoutPin: checked });
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Break Settings */}
          <TabsContent value="breaks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Break Policy
                </CardTitle>
                <CardDescription>
                  Configure break rules based on UK Working Time Regulations or your company policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-base">Breaks Are Paid</Label>
                    <p className="text-sm text-muted-foreground">
                      If enabled, break time is included in paid hours. If disabled, breaks are deducted.
                    </p>
                  </div>
                  <Switch
                    checked={breakSettings.breaksArePaid}
                    onCheckedChange={(checked) => {
                      setBreakSettings({ ...breakSettings, breaksArePaid: checked });
                      setHasChanges(true);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>Hours Before Break Allowed</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={breakSettings.minHoursBeforeBreak}
                      onChange={(e) => {
                        setBreakSettings({ ...breakSettings, minHoursBeforeBreak: parseFloat(e.target.value) || 6 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">UK regulation: 6 hours</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Break (minutes)</Label>
                    <Input
                      type="number"
                      value={breakSettings.defaultBreakMinutes}
                      onChange={(e) => {
                        setBreakSettings({ ...breakSettings, defaultBreakMinutes: parseInt(e.target.value) || 30 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">UK minimum: 20 minutes</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Break (minutes)</Label>
                    <Input
                      type="number"
                      value={breakSettings.maxBreakMinutes}
                      onChange={(e) => {
                        setBreakSettings({ ...breakSettings, maxBreakMinutes: parseInt(e.target.value) || 60 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">0 = no maximum</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Multiple Breaks</Label>
                      <p className="text-xs text-muted-foreground">Allow multiple breaks per shift</p>
                    </div>
                    <Switch
                      checked={breakSettings.allowMultipleBreaks}
                      onCheckedChange={(checked) => {
                        setBreakSettings({ ...breakSettings, allowMultipleBreaks: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Auto-Deduct Break</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatically deduct a break for shifts longer than a certain duration
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Auto-Deduct After (hours)</Label>
                      <Input
                        type="number"
                        value={breakSettings.autoDeductBreakAfterHours}
                        onChange={(e) => {
                          setBreakSettings({ ...breakSettings, autoDeductBreakAfterHours: parseInt(e.target.value) || 0 });
                          setHasChanges(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">0 = disabled</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-Deduct Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={breakSettings.autoDeductBreakMinutes}
                        onChange={(e) => {
                          setBreakSettings({ ...breakSettings, autoDeductBreakMinutes: parseInt(e.target.value) || 30 });
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Settings */}
          <TabsContent value="leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Leave Entitlement
                </CardTitle>
                <CardDescription>
                  Configure annual leave and holiday allowances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Annual Leave Days</Label>
                    <Input
                      type="number"
                      value={leaveSettings.annualLeaveDays}
                      onChange={(e) => {
                        setLeaveSettings({ ...leaveSettings, annualLeaveDays: parseInt(e.target.value) || 28 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">UK statutory: 28 days (inc. bank holidays)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Carry Over Days</Label>
                    <Input
                      type="number"
                      value={leaveSettings.maxCarryOverDays}
                      onChange={(e) => {
                        setLeaveSettings({ ...leaveSettings, maxCarryOverDays: parseInt(e.target.value) || 5 });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Notice Days</Label>
                    <Input
                      type="number"
                      value={leaveSettings.minNoticeDays}
                      onChange={(e) => {
                        setLeaveSettings({ ...leaveSettings, minNoticeDays: parseInt(e.target.value) || 1 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Advance notice required</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Allow Carry Over</Label>
                      <p className="text-xs text-muted-foreground">Unused leave to next year</p>
                    </div>
                    <Switch
                      checked={leaveSettings.allowLeaveCarryOver}
                      onCheckedChange={(checked) => {
                        setLeaveSettings({ ...leaveSettings, allowLeaveCarryOver: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Require Approval</Label>
                      <p className="text-xs text-muted-foreground">Manager must approve</p>
                    </div>
                    <Switch
                      checked={leaveSettings.requireLeaveApproval}
                      onCheckedChange={(checked) => {
                        setLeaveSettings({ ...leaveSettings, requireLeaveApproval: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Half-Day Leave</Label>
                      <p className="text-xs text-muted-foreground">Allow half-day requests</p>
                    </div>
                    <Switch
                      checked={leaveSettings.allowHalfDayLeave}
                      onCheckedChange={(checked) => {
                        setLeaveSettings({ ...leaveSettings, allowHalfDayLeave: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kiosk Settings */}
          <TabsContent value="kiosk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Kiosk Branding
                </CardTitle>
                <CardDescription>
                  Customize the kiosk appearance for your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>App Name</Label>
                    <Input
                      value={kioskSettings.appName}
                      onChange={(e) => {
                        setKioskSettings({ ...kioskSettings, appName: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={kioskSettings.appTagline}
                      onChange={(e) => {
                        setKioskSettings({ ...kioskSettings, appTagline: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Company Name</Label>
                    <Input
                      value={kioskSettings.footerCompanyName}
                      onChange={(e) => {
                        setKioskSettings({ ...kioskSettings, footerCompanyName: e.target.value });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kiosk Behavior</CardTitle>
                <CardDescription>
                  Configure how the kiosk operates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>PIN Length</Label>
                    <Input
                      type="number"
                      min="4"
                      max="8"
                      value={kioskSettings.pinLength}
                      onChange={(e) => {
                        setKioskSettings({ ...kioskSettings, pinLength: parseInt(e.target.value) || 4 });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-Logout (seconds)</Label>
                    <Input
                      type="number"
                      value={kioskSettings.autoLogoutSeconds}
                      onChange={(e) => {
                        setKioskSettings({ ...kioskSettings, autoLogoutSeconds: parseInt(e.target.value) || 0 });
                        setHasChanges(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">0 = disabled</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Show Visitor Sign-In</Label>
                    </div>
                    <Switch
                      checked={kioskSettings.showVisitorSignIn}
                      onCheckedChange={(checked) => {
                        setKioskSettings({ ...kioskSettings, showVisitorSignIn: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Show Department</Label>
                    </div>
                    <Switch
                      checked={kioskSettings.showDepartment}
                      onCheckedChange={(checked) => {
                        setKioskSettings({ ...kioskSettings, showDepartment: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Show Position</Label>
                    </div>
                    <Switch
                      checked={kioskSettings.showPosition}
                      onCheckedChange={(checked) => {
                        setKioskSettings({ ...kioskSettings, showPosition: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">Show Clock</Label>
                    </div>
                    <Switch
                      checked={kioskSettings.showClock}
                      onCheckedChange={(checked) => {
                        setKioskSettings({ ...kioskSettings, showClock: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm">24-Hour Time</Label>
                    </div>
                    <Switch
                      checked={kioskSettings.use24HourTime}
                      onCheckedChange={(checked) => {
                        setKioskSettings({ ...kioskSettings, use24HourTime: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Company Settings • Admin Access Only</p>
            <p>Changes will affect all users in the organization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

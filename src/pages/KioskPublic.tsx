export default function KioskPublic() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="card-base p-4 sm:p-6 max-w-md w-full">
                <h1 className="text-lg sm:text-xl font-semibold">Public Kiosk (Not Enabled)</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                    This file is intentionally kept for later. It will support a tablet kiosk mode without a logged-in user.
                </p>
            </div>
        </div>
    );
}

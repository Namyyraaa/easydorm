export default function AppHeader() {
    return (
        <header className="w-full border-b border-violet-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-violet-600/20 border border-violet-300 flex items-center justify-center text-sm font-semibold text-violet-700">
                        Logo
                    </div>
                    <span className="text-xl font-bold text-violet-700">ResiDorm</span>
                    
                </div>
            </div>
        </header>
    );
}

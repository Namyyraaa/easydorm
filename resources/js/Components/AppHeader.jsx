export default function AppHeader() {
    return (
        <header className="w-full border-b border-violet-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/residormumslogo.png"
                        alt="ResiDorm logo"
                        className="h-9 w-auto rounded-md  object-contain"
                    />
                    <span className="text-xl font-bold text-violet-700">ResiDorm</span>
                    
                </div>
            </div>
        </header>
    );
}

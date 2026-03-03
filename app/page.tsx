import { useEffect } from 'react';
import type { NextPage } from 'next';

const Page: NextPage = () => {
    useEffect(() => {
        // Your side effects here
    }, []);

    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500">
            <h1 className="text-white">Welcome to Passwordless Storage</h1>
            <p className="bg-gradient-to-r from-red-500 to-yellow-500 text-black p-4">Secure and Simple</p>
            {/* More content */}
        </div>
    );
};

export default Page;
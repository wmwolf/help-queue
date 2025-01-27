import React, { useState, useEffect } from 'react';
import { Clock, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';

const HelpQueue = () => {
  const [queue, setQueue] = useState([]);
  const [names, setNames] = useState('');
  const [problem, setProblem] = useState('');
  const [currentlyHelping, setCurrentlyHelping] = useState(null);

  useEffect(() => {
    const queueRef = ref(db, 'queue');
    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const queueArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setQueue(queueArray.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setQueue([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedNames = localStorage.getItem('queueNames');
    if (savedNames) {
      setNames(savedNames);
    }
  }, []);

  const addToQueue = async () => {
    if (!names.trim() || !problem.trim()) return;
    
    // Save names to localStorage
    localStorage.setItem('queueNames', names.trim());
    
    const queueRef = ref(db, 'queue');
    const newRequest = {
      names: names.trim(),
      problem: problem.trim(),
      timestamp: Date.now(),
      status: 'waiting'
    };
    
    try {
      await push(queueRef, newRequest);
      // Don't clear the names input anymore
      setProblem('');
    } catch (error) {
      console.error('Error adding request:', error);
    }
  };

  const startHelping = async (id) => {
    const requestRef = ref(db, `queue/${id}`);
    try {
      await update(requestRef, { status: 'helping' });
      setCurrentlyHelping(id);
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const resolveRequest = async (id) => {
    const requestRef = ref(db, `queue/${id}`);
    try {
      await remove(requestRef);
      if (currentlyHelping === id) {
        setCurrentlyHelping(null);
      }
    } catch (error) {
      console.error('Error removing request:', error);
    }
  };

  const formatWaitTime = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return minutes === 0 ? 'Just now' : `${minutes}m ago`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-brand-royal p-6">
          <h2 className="text-2xl font-bold text-white">Lab Help Queue</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Input Form */}
          <form 
  onSubmit={(e) => {
    e.preventDefault();  // Prevent default form submission
    addToQueue();
  }}
  className="grid grid-cols-1 md:grid-cols-12 gap-4"
>
  <input
    type="text"
    placeholder="Names (e.g. Alice & Bob)"
    value={names}
    onChange={(e) => setNames(e.target.value)}
    className="md:col-span-4 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
  />
  <input
    type="text"
    placeholder="What's the issue? (e.g. Lab 3: Part 2)"
    value={problem}
    onChange={(e) => setProblem(e.target.value)}
    className="md:col-span-6 h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
  />
  <button 
    type="submit"
    className="md:col-span-2 h-10 bg-brand-royal text-white rounded-md hover:bg-brand-royal transition-colors flex items-center justify-center gap-2"
  >
    <UserPlus className="h-4 w-4" />
    <span>Join</span>
  </button>
</form>

          {/* Queue List */}
          <div className="space-y-4">
            {queue.map((request) => (
              <div 
                key={request.id} 
                className={`rounded-lg p-4 transition-colors ${
                  request.status === 'helping' 
                    ? 'bg-green-50 border-2 border-green-500' 
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                } ${
                  request.names === names.trim()
                    ? 'border-4 border-brand-royal shadow-lg' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-gray-900 ${request.names === names.trim() ? 'font-extrabold': ''}`}>{request.names}</div>
                    <div className="text-sm text-gray-600 mt-1">{request.problem}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatWaitTime(request.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {request.status === 'waiting' && (
                      <button 
                        onClick={() => startHelping(request.id)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition-colors"
                      >
                        Start Helping
                      </button>
                    )}
                    <button
                      onClick={() => resolveRequest(request.id)}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      title={request.status === 'helping' ? 'Mark as Resolved' : 'Remove from Queue'}
                    >
                      {request.status === 'helping' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {queue.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No requests in the queue</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpQueue;
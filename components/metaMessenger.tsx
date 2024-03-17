import React, { useState } from 'react';

const WebhookTester = () => {
  const [senderId, setSenderId] = useState('');
  const [messageText, setMessageText] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const messageData = {
      object: 'page',
      entry: [{
        id: '1639249299679845', // Usa el ID real de tu página aquí
        time: Date.now(),
        messaging: [{
          sender: { id: senderId },
          recipient: { id: '1639249299679845' }, // Usa el ID real de tu página aquí
          timestamp: Date.now(),
          message: { mid: 'm_' + Date.now(), text: messageText },
        }],
      }],
    };

    try {
      const response = await fetch('/api/metaMess', { // Asegúrate de que la ruta coincide con tu archivo de la API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      alert('Mensaje enviado al webhook!');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje al webhook.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 border rounded shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="senderId" className="block text-sm font-medium text-gray-700">Sender ID</label>
          <input
            type="text"
            id="senderId"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="messageText" className="block text-sm font-medium text-gray-700">Message Text</label>
          <textarea
            id="messageText"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Enviar Mensaje
        </button>
      </form>
    </div>
  );
};

export default WebhookTester;
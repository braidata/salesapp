import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '../context/PostContext';
import PostWithComments from '../components/post'; 

const PostModalButton: React.FC<{ orderId: number; paymentValidatorId: number }> = ({ orderId, paymentValidatorId }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const handleModalOpen = () => {
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
  };

  return (
    <>
      <button
        className="bg-gradient-to-r from-yellow-600/40 to-yellow-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,177,0,0.75)]  border-yellow-800 hover:bg-yellow-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-yellow-500/40 dark:to-yellow-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-yellow-200 dark:hover:bg-yellow-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
        onClick={handleModalOpen}
      >
        Notas
      </button>

      {modalIsOpen && (
        <div
          className="mt-8 mb-8 mx-4 my-4 backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-30 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-30 flex items-center justify-center"
          id="modal"
        //   onClick={handleModalClose}
        >
          <div className="mt-8 mb-8 bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-30">
            <header className="mt-8 mb-8 bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 text-xl font-semibold dark:text-gray-300">
                Añadir Post y Comentarios
              </p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-blue-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center mx-2"
                aria-label="close"
                onClick={handleModalClose}
              >
                X
              </button>
            </header>
            <div className="max-h-[80vh] overflow-y-auto">
              <section className="p-2 dark:text-gray-300 mt-2 rounded-lg">
                <PostWithComments orderId={orderId} paymentValidatorId={paymentValidatorId} />
              </section>
              <footer className="flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80"></footer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostModalButton;

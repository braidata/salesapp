import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePosts } from '../context/PostContext';

const PostWithComments: React.FC<{ orderId: number; paymentValidatorId: number }> = ({ orderId, paymentValidatorId }) => {
  const { data: session } = useSession();
  const { posts, fetchPosts, addPost, addComment } = usePosts();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isPostInputVisible, setIsPostInputVisible] = useState(false);
  const [userNames, setUserNames] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchPosts(orderId, paymentValidatorId);
  }, [orderId, paymentValidatorId]);

  useEffect(() => {
    if (posts.length > 0) {
      const fetchUserNames = async () => {
        const names = await Promise.all(
          posts.flatMap(post => post.comments.map(async comment => {
            if (!userNames[comment.userId]) {
              const response = await fetch(`/api/mysqlUserId?userId=${comment.userId}`);
              const data = await response.json();
              console.log(`Fetched userId: ${comment.userId}, name: ${data.name}`);
              return data && data.name ? { userId: comment.userId, name: data.name } : null;
            }
            return null;
          })).filter(Boolean)
        );
        const newUserNames = names.reduce((acc, param) => {
          if (param) {
            const { userId, name } = param;
            if (userId && name) { // Verificación adicional
              acc[userId] = name;
            } else {
              console.error(`Invalid data: userId: ${userId}, name: ${name}`);
            }
          }
          return acc;
        }, {});
        setUserNames(prev => ({ ...prev, ...newUserNames }));
      };
      fetchUserNames();
    }
  }, [posts]);

  const handleAddPost = async () => {
    if (session && newPostContent.trim()) {
      const post = {
        orderId,
        paymentValidatorId,
        userId: parseInt(session.token.sub),
        authorId: parseInt(session.token.sub),
        title: newPostTitle,
        content: newPostContent,
        category: 'general',
        comments: [],
      };
      await addPost(post);
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts(orderId, paymentValidatorId);
      setIsPostInputVisible(false); // Oculta el campo después de enviar
    }
  };

  const handleAddComment = async (postId: number) => {
    if (session && newCommentContent.trim()) {
      const comment = {
        postId,
        userId: parseInt(session.token.sub),
        content: newCommentContent,
        status: 'active',
        category: 'comment',
      };
      await addComment(comment);
      setNewCommentContent('');
      setSelectedPostId(null);
      fetchPosts(orderId, paymentValidatorId);
    }
  };

  const togglePostInput = () => {
    setIsPostInputVisible(!isPostInputVisible);
  };

  const filteredPosts = posts.filter(post => post.orderId === orderId && post.paymentValidatorId === paymentValidatorId);

  return (
    <div className="p-4 rounded-lg shadow-lg dark:bg-gray-800 bg-gray-100">
      <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-800">Posts y Comentarios</h2>
      {!isPostInputVisible && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={togglePostInput}>
          Añadir Post
        </button>
      )}
      {isPostInputVisible && (
        <>
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Título
          </label>
          <input
            className="w-full p-2 mb-4 rounded dark:bg-gray-700 bg-gray-200 dark:text-white text-gray-800"
            placeholder="Escribe un nuevo post..."
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Mensaje
          </label>
          <textarea
            className="w-full p-2 mb-4 rounded dark:bg-gray-700 bg-gray-200 dark:text-white text-gray-800"
            placeholder="Escribe un nuevo post..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAddPost}>
            Publicar Post
          </button>
        </>
      )}
      <div className="mt-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="p-4 mb-4 rounded dark:bg-gray-900 bg-gray-300">
            <h3 className="text-lg font-bold dark:text-white text-gray-800">{post.title}</h3>
            <p className="dark:text-gray-400 text-gray-700">{post.content}</p>
            <div className="mt-2">
              {post.comments && post.comments.map((comment) => (
                <div key={comment.id} className="p-2 mb-2 rounded dark:bg-gray-700 bg-gray-200">
                  <h6 className="text-sm dark:text-gray-300 text-gray-600">
                    {userNames[comment.userId] || 'Cargando...'}
                  </h6>
                  <p className="dark:text-white text-gray-800">{comment.content}</p>
                </div>
              ))}
            </div>
            {selectedPostId === post.id ? (
              <div className="mt-2">
                <textarea
                  className="w-full p-2 mb-2 rounded dark:bg-gray-700 bg-gray-200 dark:text-white text-gray-800"
                  placeholder="Escribe un comentario..."
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => handleAddComment(post.id)}>
                  Añadir Comentario
                </button>
              </div>
            ) : (
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded mt-2"
                onClick={() => setSelectedPostId(post.id)}
              >
                Comentar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostWithComments;









import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api.config';
import './Shop.css';

const Shop = () => {
  const navigate = useNavigate();
  const [shopItems, setShopItems] = useState({});
  const [userCoins, setUserCoins] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({
    avatarBorder: null,
    carSkin: null,
    tankSkin: null
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const token = localStorage.getItem('O_authWEB');

  useEffect(() => {
    fetchUserData();
    fetchShopItems();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/userAuthorize/${token}`);
      const data = await response.json();
      if (data.message === 'success') {
        const user = data.userInfo;
        setUserCoins(user.coins || 0);
        setUnlockedItems(user.unlockedItems || []);
        setEquippedItems({
          avatarBorder: user.currentAvatarBorder,
          carSkin: user.currentCarSkin,
          tankSkin: user.currentTankSkin
        });
      }
    } catch (error) {
      console.error('Error fetching user data', error);
    }
  };

  const fetchShopItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/shop`);
      const data = await response.json();
      if (data.message === 'success') {
        setShopItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching shop items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/buyItem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          authrization: `Bearer ${token}` 
        },
        body: JSON.stringify({ itemId })
      });
      const data = await response.json();
      if (data.message === 'success') {
        setUserCoins(data.coins);
        setUnlockedItems(data.unlockedItems);
        showMessage('Item purchased successfully!', 'success');
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage(error.message || 'Error purchasing item', 'error');
    }
  };

  const handleEquip = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/equipItem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          authrization: `Bearer ${token}` 
        },
        body: JSON.stringify({ itemId })
      });
      const data = await response.json();
      if (data.message === 'success') {
        setEquippedItems({
          avatarBorder: data.currentAvatarBorder,
          carSkin: data.currentCarSkin,
          tankSkin: data.currentTankSkin
        });
        showMessage('Item equipped!', 'success');
      }
    } catch (error) {
      showMessage('Error equipping item', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) return <div className="shop-container">Loading...</div>;

  const groupedItems = Object.entries(shopItems).reduce((acc, [id, item]) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push({ id, ...item });
    return acc;
  }, {});

  const renderItemPreview = (item) => {
    if (item.type === 'avatarBorder') {
      let borderStyle = {};
      if (item.id === 'border_gold') borderStyle = { borderColor: '#fbbf24' };
      if (item.id === 'border_neon') borderStyle = { borderColor: '#a855f7', boxShadow: '0 0 10px #a855f7' };
      if (item.id === 'border_fire') borderStyle = { borderColor: '#ef4444', boxShadow: '0 0 10px #ef4444' };
      return <div className="shop-item-preview preview-avatarBorder" style={borderStyle}>👤</div>;
    }
    if (item.type === 'carSkin' || item.type === 'tankSkin') {
      return <div className={`shop-item-preview preview-${item.type}`} style={{ backgroundColor: item.color }}></div>;
    }
    return <div className="shop-item-preview">🎁</div>;
  };

  return (
    <div className="shop-container">
      <div className="shop-header" style={{ position: 'relative' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
        >✖</button>
        <h1>Rewards Shop</h1>
        <div className="coin-balance">
          <span className="coin-icon">🪙</span>
          <span>{userCoins} Coins</span>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {Object.entries(groupedItems).map(([type, items]) => (
        <div key={type} className="shop-section">
          <h2>{type === 'avatarBorder' ? 'Avatar Borders' : type === 'carSkin' ? 'Math Racer Cars' : 'Tanks Game Skins'}</h2>
          <div className="shop-grid">
            {items.map(item => {
              const isOwned = unlockedItems.includes(item.id);
              const isEquipped = Object.values(equippedItems).includes(item.id);

              return (
                <div key={item.id} className="shop-item-card">
                  {renderItemPreview(item)}
                  <div className="shop-item-name">{item.name}</div>
                  
                  {!isOwned && (
                    <div className="shop-item-price">
                      <span className="coin-icon">🪙</span> {item.price}
                    </div>
                  )}

                  {isOwned ? (
                    isEquipped ? (
                      <button className="shop-action-btn equipped">Equipped</button>
                    ) : (
                      <button className="shop-action-btn equip" onClick={() => handleEquip(item.id)}>Equip</button>
                    )
                  ) : (
                    <button className="shop-action-btn buy" onClick={() => handleBuy(item.id)}>Buy</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Shop;

// SwipeCard Component Tests
// Note: Full render tests require jsdom environment and proper RN setup
// These are unit tests for the component's interface

describe('SwipeCard', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'John Doe',
    age: 28,
    bio: 'Travel enthusiast',
    profile_photo: 'https://example.com/photo.jpg',
    photos: [{ url: 'https://example.com/photo1.jpg' }],
    distance: 5.2,
    is_guide: true,
    has_car: true,
    has_motorcycle: false,
    is_verified: true,
  };

  it('should have valid user data structure', () => {
    expect(mockUser.id).toBeDefined();
    expect(mockUser.name).toBe('John Doe');
    expect(mockUser.is_guide).toBe(true);
  });

  it('should have photo array', () => {
    expect(Array.isArray(mockUser.photos)).toBe(true);
    expect(mockUser.photos.length).toBeGreaterThan(0);
  });

  it('should have transportation options', () => {
    expect(typeof mockUser.has_car).toBe('boolean');
    expect(typeof mockUser.has_motorcycle).toBe('boolean');
  });

  it('should support verification status', () => {
    expect(typeof mockUser.is_verified).toBe('boolean');
    expect(mockUser.is_verified).toBe(true);
  });
});

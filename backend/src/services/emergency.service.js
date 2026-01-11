const knex = require('../config/database');

class EmergencyService {
  static MAX_CONTACTS = 3;

  static async getContacts(userId) {
    const contacts = await knex('emergency_contacts')
      .where({ user_id: userId })
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc');

    return contacts;
  }

  static async addContact(userId, contactData) {
    const existingCount = await knex('emergency_contacts')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    if (parseInt(existingCount.count) >= this.MAX_CONTACTS) {
      const error = new Error(`Maximum ${this.MAX_CONTACTS} emergency contacts allowed`);
      error.statusCode = 400;
      error.code = 'EMERGENCY_MAX_CONTACTS';
      throw error;
    }

    if (contactData.is_primary) {
      await knex('emergency_contacts')
        .where({ user_id: userId })
        .update({ is_primary: false });
    }

    const [contact] = await knex('emergency_contacts')
      .insert({
        user_id: userId,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        relationship: contactData.relationship,
        is_primary: contactData.is_primary || false,
      })
      .returning('*');

    return contact;
  }

  static async updateContact(contactId, userId, updates) {
    const contact = await knex('emergency_contacts')
      .where({ id: contactId, user_id: userId })
      .first();

    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      error.code = 'EMERGENCY_CONTACT_NOT_FOUND';
      throw error;
    }

    if (updates.is_primary) {
      await knex('emergency_contacts')
        .where({ user_id: userId })
        .whereNot({ id: contactId })
        .update({ is_primary: false });
    }

    const [updated] = await knex('emergency_contacts')
      .where({ id: contactId })
      .update({
        name: updates.name || contact.name,
        phone: updates.phone || contact.phone,
        email: updates.email !== undefined ? updates.email : contact.email,
        relationship: updates.relationship || contact.relationship,
        is_primary: updates.is_primary !== undefined ? updates.is_primary : contact.is_primary,
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return updated;
  }

  static async deleteContact(contactId, userId) {
    const deleted = await knex('emergency_contacts')
      .where({ id: contactId, user_id: userId })
      .delete();

    if (!deleted) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      error.code = 'EMERGENCY_CONTACT_NOT_FOUND';
      throw error;
    }

    return { success: true };
  }

  static async shareMeeting(userId, data) {
    const { match_id, contact_ids, meeting_location, meeting_time, meeting_coordinates } = data;

    const match = await knex('matches')
      .where({ id: match_id })
      .where(function() {
        this.where('user1_id', userId).orWhere('user2_id', userId);
      })
      .first();

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      error.code = 'EMERGENCY_MATCH_NOT_FOUND';
      throw error;
    }

    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    const otherUser = await knex('users')
      .where({ id: otherUserId })
      .select('name')
      .first();

    const contacts = await knex('emergency_contacts')
      .where({ user_id: userId })
      .whereIn('id', contact_ids);

    if (contacts.length === 0) {
      const error = new Error('No valid contacts found');
      error.statusCode = 400;
      error.code = 'EMERGENCY_NO_CONTACTS';
      throw error;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const shares = [];
    for (const contact of contacts) {
      const shareData = {
        user_id: userId,
        match_id,
        contact_id: contact.id,
        meeting_location,
        meeting_time,
        meeting_with_name: otherUser.name,
        expires_at: expiresAt,
      };

      if (meeting_coordinates) {
        shareData.meeting_coordinates = knex.raw(
          `ST_SetSRID(ST_MakePoint(?, ?), 4326)`,
          [meeting_coordinates.lng, meeting_coordinates.lat]
        );
      }

      const [share] = await knex('meeting_shares')
        .insert(shareData)
        .returning('*');

      shares.push(share);

      // In production, send SMS/email notification to contact
      console.log(`[EMERGENCY] Meeting shared with ${contact.name} (${contact.phone})`);
    }

    return {
      success: true,
      shares_created: shares.length,
      expires_at: expiresAt,
    };
  }

  static async checkIn(shareId, userId) {
    const [share] = await knex('meeting_shares')
      .where({ id: shareId, user_id: userId })
      .update({
        status: 'checked_in',
        checked_in_at: knex.fn.now(),
      })
      .returning('*');

    if (!share) {
      const error = new Error('Share not found');
      error.statusCode = 404;
      error.code = 'EMERGENCY_SHARE_NOT_FOUND';
      throw error;
    }

    return share;
  }

  static async getActiveShares(userId) {
    const shares = await knex('meeting_shares')
      .where({ user_id: userId })
      .where('status', 'active')
      .where('expires_at', '>', knex.fn.now())
      .join('emergency_contacts', 'meeting_shares.contact_id', 'emergency_contacts.id')
      .select(
        'meeting_shares.*',
        'emergency_contacts.name as contact_name',
        'emergency_contacts.phone as contact_phone'
      )
      .orderBy('meeting_shares.shared_at', 'desc');

    return shares;
  }

  static async sendSOS(userId, currentLocation) {
    const contacts = await knex('emergency_contacts')
      .where({ user_id: userId })
      .orderBy('is_primary', 'desc');

    if (contacts.length === 0) {
      const error = new Error('No emergency contacts configured');
      error.statusCode = 400;
      error.code = 'EMERGENCY_NO_CONTACTS';
      throw error;
    }

    const user = await knex('users')
      .where({ id: userId })
      .select('name')
      .first();

    // In production, send SMS/push notifications to all contacts
    for (const contact of contacts) {
      console.log(`[SOS ALERT] Sending emergency alert to ${contact.name} (${contact.phone})`);
      console.log(`[SOS ALERT] User: ${user.name}, Location: ${JSON.stringify(currentLocation)}`);
    }

    return {
      success: true,
      alerts_sent: contacts.length,
      contacts_notified: contacts.map(c => ({ name: c.name, phone: c.phone })),
    };
  }
}

module.exports = EmergencyService;

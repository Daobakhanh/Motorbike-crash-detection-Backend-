const { default: Container } = require('typedi');

require('../../types');
const { DI_KEYS } = require('../../commons/constants');

class AppService {
  constructor() {
    /**
     * @type {import('firebase-admin/lib/storage/storage').Storage}
     * @private
     */
    this.storage = Container.get(DI_KEYS.FB_STORAGE);
  }

  async uploadFileToFbStorage(file) {
    const bucket = this.storage.bucket();
    const blob = bucket.file(new Date().getTime() + file.originalname);

    await blob.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      public: true,
    });

    return blob.publicUrl();
  }
}

module.exports = AppService;

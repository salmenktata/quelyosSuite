/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class ImageUploadWidget extends Component {
    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({
            isDragging: false,
            uploading: false,
            uploadProgress: {},
        });
    }

    // Drag & drop handlers
    onDragOver(ev) {
        ev.preventDefault();
        this.state.isDragging = true;
    }

    onDragLeave(ev) {
        this.state.isDragging = false;
    }

    async onDrop(ev) {
        ev.preventDefault();
        this.state.isDragging = false;
        const files = Array.from(ev.dataTransfer.files);
        await this.uploadMultipleFiles(files);
    }

    async onFileSelect(ev) {
        const files = Array.from(ev.target.files);
        await this.uploadMultipleFiles(files);
    }

    async uploadMultipleFiles(files) {
        // Validate files
        const validFiles = [];
        for (const file of files) {
            try {
                this.validateFile(file);
                validFiles.push(file);
            } catch (error) {
                this.notification.add(error.message, { type: "warning" });
            }
        }

        if (validFiles.length === 0) return;

        // Convert to base64
        this.state.uploading = true;
        const imagesData = await Promise.all(
            validFiles.map(f => this.fileToBase64(f))
        );

        // Bulk upload via RPC
        try {
            await this.orm.call(
                "product.product.image",
                "create_bulk",
                [this.props.record.resId, imagesData]
            );

            this.notification.add(
                `${validFiles.length} image(s) uploaded successfully`,
                { type: "success" }
            );

            // Reload field
            await this.props.record.load();
        } catch (error) {
            this.notification.add(`Upload failed: ${error.message}`, { type: "danger" });
        } finally {
            this.state.uploading = false;
        }
    }

    validateFile(file) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        if (file.size > maxSize) {
            throw new Error(`${file.name}: Trop grand (max 2MB)`);
        }
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`${file.name}: Format invalide (PNG/JPG uniquement)`);
        }
        return true;
    }

    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                image: reader.result.split(',')[1],
                alt_text: file.name.replace(/\.[^/.]+$/, "")
            });
            reader.readAsDataURL(file);
        });
    }
}

ImageUploadWidget.template = "quelyos_ecommerce.ImageUploadWidget";
ImageUploadWidget.props = {
    ...standardFieldProps,
};

registry.category("fields").add("image_dropzone", ImageUploadWidget);

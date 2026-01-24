# -*- coding: utf-8 -*-

from odoo.tests import TransactionCase, tagged
from odoo.exceptions import ValidationError
import base64


@tagged('post_install', '-at_install', 'product_gallery')
class TestProductGallery(TransactionCase):
    """Test suite for product image gallery system"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Create test product
        cls.product = cls.env['product.template'].create({
            'name': 'Test Product for Gallery',
            'type': 'consu',
            'list_price': 100.0,
            'sale_ok': True,
        })

        # Create fake image data (1x1 PNG)
        cls.test_image_1 = base64.b64encode(
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01'
            b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        cls.test_image_2 = cls.test_image_1  # Same image for simplicity

    def test_create_image(self):
        """Test creating a product image"""
        image = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'alt_text': 'Test Image',
            'sequence': 10,
        })

        self.assertTrue(image.exists())
        self.assertEqual(image.product_tmpl_id, self.product)
        self.assertEqual(image.alt_text, 'Test Image')
        self.assertEqual(image.sequence, 10)
        # First image should be auto-marked as main
        self.assertTrue(image.is_main)

    def test_first_image_auto_main(self):
        """Test that first image is automatically marked as main"""
        image = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'is_main': False,  # Explicitly set to False
        })

        # Should be auto-set to True since it's the first image
        self.assertTrue(image.is_main)

    def test_single_main_image_constraint(self):
        """Test that only one image can be marked as main"""
        # Create first image (auto-marked as main)
        image1 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
        })

        # Create second image
        image2 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_2,
            'is_main': False,
        })

        # Try to mark second image as main while first is also main
        with self.assertRaises(ValidationError) as cm:
            image2.write({'is_main': True})

        self.assertIn('Only one image can be marked as main', str(cm.exception))

    def test_sequence_ordering(self):
        """Test that images are ordered by sequence"""
        image1 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'sequence': 20,
        })
        image2 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_2,
            'sequence': 10,
            'is_main': False,
        })

        # Fetch images sorted by sequence
        images = self.product.image_ids.sorted('sequence')

        self.assertEqual(len(images), 2)
        self.assertEqual(images[0], image2)  # sequence 10 comes first
        self.assertEqual(images[1], image1)  # sequence 20 comes second

    def test_cascade_delete(self):
        """Test that images are deleted when product is deleted"""
        image = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
        })

        image_id = image.id
        self.product.unlink()

        # Image should be deleted (cascade)
        self.assertFalse(self.env['product.product.image'].browse(image_id).exists())

    def test_image_url_computation(self):
        """Test that image URL is correctly computed"""
        image = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
        })

        expected_url = f'/web/image/product.product.image/{image.id}/image'
        self.assertEqual(image.image_url, expected_url)

    def test_get_api_data(self):
        """Test that get_api_data returns correct format"""
        image = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'alt_text': 'API Test Image',
            'sequence': 15,
            'is_main': True,
        })

        api_data = image.get_api_data()

        self.assertIsInstance(api_data, dict)
        self.assertEqual(api_data['id'], image.id)
        self.assertEqual(api_data['url'], image.image_url)
        self.assertEqual(api_data['alt'], 'API Test Image')
        self.assertEqual(api_data['is_main'], True)
        self.assertEqual(api_data['sequence'], 15)

    def test_product_image_count(self):
        """Test that product image_count field is computed correctly"""
        self.assertEqual(self.product.image_count, 0)

        # Add first image
        self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
        })
        self.assertEqual(self.product.image_count, 1)

        # Add second image
        self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_2,
            'is_main': False,
        })
        self.assertEqual(self.product.image_count, 2)

    def test_product_get_api_data_with_gallery(self):
        """Test that product.get_api_data() includes gallery images"""
        # Create gallery images
        image1 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'alt_text': 'Main Image',
            'sequence': 10,
            'is_main': True,
        })
        image2 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_2,
            'alt_text': 'Secondary Image',
            'sequence': 20,
            'is_main': False,
        })

        api_data = self.product.get_api_data()

        # Check images array
        self.assertIn('images', api_data)
        self.assertEqual(len(api_data['images']), 2)

        # Check first image (main)
        first_image = api_data['images'][0]
        self.assertEqual(first_image['id'], image1.id)
        self.assertEqual(first_image['alt'], 'Main Image')
        self.assertTrue(first_image['is_main'])

        # Check second image
        second_image = api_data['images'][1]
        self.assertEqual(second_image['id'], image2.id)
        self.assertEqual(second_image['alt'], 'Secondary Image')
        self.assertFalse(second_image['is_main'])

    def test_product_get_api_data_fallback(self):
        """Test that product.get_api_data() falls back to image_1920 if no gallery"""
        # Set image_1920 on product
        self.product.write({'image_1920': self.test_image_1})

        api_data = self.product.get_api_data()

        # Should have fallback image
        self.assertIn('images', api_data)
        self.assertEqual(len(api_data['images']), 1)
        self.assertTrue(api_data['images'][0]['is_main'])
        self.assertIn('image_1920', api_data['images'][0]['url'])

    def test_action_set_as_main(self):
        """Test action_set_as_main method"""
        image1 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'is_main': True,
        })
        image2 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_2,
            'is_main': False,
        })

        # Set image2 as main
        image2.action_set_as_main()

        # Refresh records
        image1.invalidate_recordset()
        image2.invalidate_recordset()

        # Check that only image2 is main
        self.assertFalse(image1.is_main)
        self.assertTrue(image2.is_main)

    def test_image_validation_format(self):
        """Test that invalid image formats are rejected"""
        # Try to create image with invalid format (not a real image)
        with self.assertRaises(ValidationError):
            self.env['product.product.image'].create({
                'product_tmpl_id': self.product.id,
                'image': base64.b64encode(b'not a valid image'),
            })

    def test_multiple_products_independent_main_images(self):
        """Test that different products can each have their own main image"""
        product2 = self.env['product.template'].create({
            'name': 'Second Test Product',
            'type': 'consu',
            'list_price': 50.0,
        })

        # Create main image for first product
        image1 = self.env['product.product.image'].create({
            'product_tmpl_id': self.product.id,
            'image': self.test_image_1,
            'is_main': True,
        })

        # Create main image for second product
        image2 = self.env['product.product.image'].create({
            'product_tmpl_id': product2.id,
            'image': self.test_image_2,
            'is_main': True,
        })

        # Both should be main (different products)
        self.assertTrue(image1.is_main)
        self.assertTrue(image2.is_main)

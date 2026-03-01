"""Initial migration with all models

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create collection_centers table
    op.create_table(
        'collection_centers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_collection_centers_id'), 'collection_centers', ['id'], unique=False)

    # Create workers table
    op.create_table(
        'workers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('aadhar_id', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('worker_type', sa.String(), nullable=False),
        sa.Column('worker_id', sa.String(length=8), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('mpin_hash', sa.Text(), nullable=True),
        sa.Column('collection_center_id', sa.Integer(), nullable=True),
        sa.Column('profile_photo_url', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['collection_center_id'], ['collection_centers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('aadhar_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('worker_id')
    )
    op.create_index(op.f('ix_workers_id'), 'workers', ['id'], unique=False)
    op.create_index(op.f('ix_workers_worker_id'), 'workers', ['worker_id'], unique=False)

    # Create beneficiaries table
    op.create_table(
        'beneficiaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('aadhar_id', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('mcts_id', sa.String(), nullable=True),
        sa.Column('beneficiary_type', sa.String(), nullable=False),
        sa.Column('assigned_asha_id', sa.Integer(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_asha_id'], ['workers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('mcts_id')
    )
    op.create_index(op.f('ix_beneficiaries_id'), 'beneficiaries', ['id'], unique=False)
    op.create_index(op.f('ix_beneficiaries_mcts_id'), 'beneficiaries', ['mcts_id'], unique=False)

    # Create visit_templates table
    op.create_table(
        'visit_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_visit_templates_id'), 'visit_templates', ['id'], unique=False)
    op.create_index(op.f('ix_visit_templates_template_type'), 'visit_templates', ['template_type'], unique=False)

    # Create visits table
    op.create_table(
        'visits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_type', sa.String(), nullable=False),
        sa.Column('visit_date_time', sa.DateTime(), nullable=False),
        sa.Column('day_number', sa.Integer(), nullable=True),
        sa.Column('is_synced', sa.Boolean(), nullable=False),
        sa.Column('assigned_asha_id', sa.Integer(), nullable=False),
        sa.Column('beneficiary_id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('visit_data', sa.JSON(), nullable=False),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('synced_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_asha_id'], ['workers.id'], ),
        sa.ForeignKeyConstraint(['beneficiary_id'], ['beneficiaries.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['visit_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_visits_id'), 'visits', ['id'], unique=False)
    op.create_index(op.f('ix_visits_is_synced'), 'visits', ['is_synced'], unique=False)
    op.create_index(op.f('ix_visits_visit_date_time'), 'visits', ['visit_date_time'], unique=False)
    op.create_index(op.f('ix_visits_visit_type'), 'visits', ['visit_type'], unique=False)

    # Create sync_logs table
    op.create_table(
        'sync_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=True),
        sa.Column('worker_id', sa.Integer(), nullable=False),
        sa.Column('collection_center_id', sa.Integer(), nullable=True),
        sa.Column('date_time', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['collection_center_id'], ['collection_centers.id'], ),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.ForeignKeyConstraint(['worker_id'], ['workers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sync_logs_date_time'), 'sync_logs', ['date_time'], unique=False)
    op.create_index(op.f('ix_sync_logs_id'), 'sync_logs', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_sync_logs_id'), table_name='sync_logs')
    op.drop_index(op.f('ix_sync_logs_date_time'), table_name='sync_logs')
    op.drop_table('sync_logs')
    
    op.drop_index(op.f('ix_visits_visit_type'), table_name='visits')
    op.drop_index(op.f('ix_visits_visit_date_time'), table_name='visits')
    op.drop_index(op.f('ix_visits_is_synced'), table_name='visits')
    op.drop_index(op.f('ix_visits_id'), table_name='visits')
    op.drop_table('visits')
    
    op.drop_index(op.f('ix_visit_templates_template_type'), table_name='visit_templates')
    op.drop_index(op.f('ix_visit_templates_id'), table_name='visit_templates')
    op.drop_table('visit_templates')
    
    op.drop_index(op.f('ix_beneficiaries_mcts_id'), table_name='beneficiaries')
    op.drop_index(op.f('ix_beneficiaries_id'), table_name='beneficiaries')
    op.drop_table('beneficiaries')
    
    op.drop_index(op.f('ix_workers_worker_id'), table_name='workers')
    op.drop_index(op.f('ix_workers_id'), table_name='workers')
    op.drop_table('workers')
    
    op.drop_index(op.f('ix_collection_centers_id'), table_name='collection_centers')
    op.drop_table('collection_centers')

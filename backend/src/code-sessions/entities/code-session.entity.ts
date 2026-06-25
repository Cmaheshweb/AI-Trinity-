import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CodeSessionStatus, CodeSessionType } from '../../common/constants/app.constants';

@Entity('code_sessions')
export class CodeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: CodeSessionType })
  sessionType: CodeSessionType;

  @Column({ type: 'enum', enum: CodeSessionStatus, default: CodeSessionStatus.PENDING })
  status: CodeSessionStatus;

  @Column({ name: 'input_s3_key', length: 500 })
  inputS3Key: string; // S3 path for input code

  @Column({ name: 'output_s3_key', length: 500, nullable: true })
  outputS3Key: string; // S3 path for output code/report

  @Column({ name: 'requested_language', length: 50, nullable: true })
  requestedLanguage: string;

  @Column({ name: 'requested_framework', length: 50, nullable: true })
  requestedFramework: string;

  @Column({ name: 'request_details', type: 'jsonb', nullable: true })
  requestDetails: object; // Additional details from user request

  @Column({ name: 'result_details', type: 'jsonb', nullable: true })
  resultDetails: object; // Processing details, errors, recommendations

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date; // When the S3 data associated with this session should be deleted
}
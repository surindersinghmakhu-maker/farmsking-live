export declare class FeaturePermissionDto {
    view: boolean;
    entry: boolean;
}
export declare class SupervisorFeaturesConfigDto {
    sales?: FeaturePermissionDto;
    labour?: FeaturePermissionDto;
    spray?: FeaturePermissionDto;
    purchases?: FeaturePermissionDto;
    crops?: FeaturePermissionDto;
    advisory?: FeaturePermissionDto;
}
export declare class AppointSupervisorRequestDto {
    supervisorKingId: string;
    featuresConfig: SupervisorFeaturesConfigDto;
    note?: string;
}
export declare class RespondSupervisorRequestDto {
    action: 'ACCEPT' | 'REJECT';
}
